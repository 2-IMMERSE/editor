import time
import Queue
import threading

class never:
    """This object is greater than any number"""
    pass
    
assert never > 1

DEBUG_LOCKING=False
#threading._VERBOSE=True

if DEBUG_LOCKING:
    import logging
    import traceback
    clockLockLog = logging.getLogger("clocks.locks")
    clockLockLog.setLevel(logging.DEBUG)
    class ClockLock:
        def __init__(self):
            self._lock = threading.RLock()
            
        def acquire(self,*args, **kwargs):
            clockLockLog.debug("%s: %s.acquire()", threading.currentThread().getName(), self)
            for s in traceback.extract_stack():
                clockLockLog.info('    Trace %s:%s [%s] %s' % s)
            return self._lock.acquire(*args, **kwargs)

        def release(self):
            clockLockLog.debug("%s: %s.release()", threading.currentThread().getName(), self)
            for s in traceback.extract_stack():
                clockLockLog.info('    Trace %s:%s [%s] %s' % s)
            return self._lock.release()

        __enter__ = acquire
        def __exit__(self, *args):
            self.release()
else:
    ClockLock = threading.RLock
    
def synchronized(method):
    """Annotate a mthod to use the object lock"""
    def wrapper(self, *args, **kwargs):
        with self.lock:
            return method(self, *args, **kwargs)
    return wrapper
            
class PausableClock:
    """A clock (based on another clock) that can be pasued and resumed"""
    def __init__(self, underlyingClock):
        self.epoch = 0
        self.running = False
        self.underlyingClock = underlyingClock
        self.originalUnderlyingClock = underlyingClock
        self.replacementTime = None
        self.lock = ClockLock()

    @synchronized
    def now(self):
        """Return current time of the clock"""
        return self._now()
        
    def _now(self):
        if not self.running:
            return self.epoch
        return self.underlyingClock.now() - self.epoch
        
    def dumps(self):
        return None

    @synchronized
    def start(self):
        """Start the clock running"""
        if not self.running:
            self.epoch = self.underlyingClock.now() - self.epoch
            self.running = True

    @synchronized
    def stop(self):
        """Stop the clock"""
        if self.running:
            self.epoch = self.underlyingClock.now() - self.epoch
            self.running = False
            
    def getRate(self):
        if self.running:
            return self.underlyingClock.getRate()
        return 0.0
        
    @synchronized
    def replaceUnderlyingClock(self, newClock):
        assert newClock
        assert self.underlyingClock == self.originalUnderlyingClock
        wasRunning = self.running
        self.stop() # This also stores current time in self.epoch
        self.underlyingClock = newClock
        self.replacementTime = self._now()
        if wasRunning:
            self.start()    # This starts the clock running at the place it was
        
    @synchronized
    def restoreUnderlyingClock(self, restoreTime):
        assert self.underlyingClock != self.originalUnderlyingClock
        adjustment = 0
        wasRunning = self.running
        self.stop()
        if restoreTime:
            # Compute how far we have moved time forward while running on the replacement
            # clock, and then adjust accordingly
            adjustment = self.replacementTime - self._now()
            self._adjust(adjustment)
        self.underlyingClock = self.originalUnderlyingClock

        if wasRunning:
            self.start()    # This starts the clock running at the place it was
        return adjustment
    
    @synchronized
    def set(self, now):
        wasRunning = self.running
        self.stop()
        self.epoch = now
        if wasRunning:
            self.start()
            
    def _adjust(self, adjustment):
        self.epoch += adjustment
        
class CallbackPausableClock(PausableClock):
    """A pausable clock that also stores callbacks with certain times"""
    
    def __init__(self, underlyingClock):
        PausableClock.__init__(self, underlyingClock)
        self.queue = Queue.PriorityQueue()
        self.queueChanged = None

    def setQueueChangedCallback(self, callback):
        self.queueChanged = callback
        
    @synchronized
    def nextEventTime(self, default=never):
        """Return delta-T until earliest callback, or never"""
        try:
            peek = self.queue.get(False)
        except Queue.Empty:
            return default
        self.queue.put(peek)
        t, callback, args, kwargs = peek
        return t-self._now()
        
    def sleepUntilNextEvent(self):
        """Sleep until next callback. Do not use with multithreading."""
        try:
            peek = self.queue.get(False)
        except Queue.Empty:
            assert 0, "No events are forthcoming"
        assert peek, "No events are forthcoming"
        self.queue.put(peek)
        t, callback, args, kwargs = peek
        delta = t-self.now()
        if delta > 0:
            self.underlyingClock.sleep(delta)
        
    def schedule(self, delay, callback, *args, **kwargs):
        """Schedule a callback"""
        self.scheduleAt(self.now()+delay, callback, *args, **kwargs)
    
    def scheduleAt(self, timestamp, callback, *args, **kwargs):
        """Schedule a callback"""
        assert not self.queue.full()
        self.queue.put((timestamp, callback, args, kwargs))
        if self.queueChanged:
            self.queueChanged()
        
    @synchronized
    def handleEvents(self, handler):
        """Retrieve all callbacks that are runnable"""
        while True:
            try:
                peek = self.queue.get(False)
            except Queue.Empty:
                return
            if not peek: return
            t, callback, args, kwargs = peek
            if self._now() >= t:
                if self._now() > t + 0.1:
                    print 'xxxjack scheduling', self.now() - t, 'seconds too late...'
                handler.schedule(callback, *args, **kwargs)
            else:
                assert not self.queue.full()
                self.queue.put(peek)
                return
                
    @synchronized
    def dumps(self):
        rv = "%d events" % self.queue.qsize()
        try:
            peek = self.queue.get(False)
        except Queue.Empty:
            peek = None
        if peek:
            t, callback, args, kwargs = peek
            rv += ", next in %f seconds" % (t-self._now())
            self.queue.put(peek)
        return rv
        
    def _adjust(self, adjustment):
        # First get all the queued events
        qContents = []
        while True:
            try:
                qContents.append(self.queue.get(False))
            except Queue.Empty:
                break
        # Now adjust the clock itself
        PausableClock._adjust(self, adjustment)
        # Now re-insert all events with adjusted times
        for t, callback, args, kwargs in qContents:
            t += adjustment
            self.queue.put((t, callback, args, kwargs))
        
class FastClock:
    def __init__(self):
        self._now = 0
        
    def now(self):
        return self._now
        
    def sleep(self, duration):
        self._now += duration
        
    def dumps(self):
        return ""
        
    def getRate(self):
        return 1.0

class SystemClock:
    def __init__(self):
        pass
        
    def now(self):
        return time.time()
        
    def sleep(self, duration):
        time.sleep(duration)

    def dumps(self):
        return ""
        
    def getRate(self):
        return 1.0