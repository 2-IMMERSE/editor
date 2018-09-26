from __future__ import unicode_literals
from builtins import object
import logging
import datetime
import time
import sys

logging.basicConfig()

# Default logging configuration: INFO for document and timeline (useful to app developers), WARNING for everything else.
# DEFAULT_LOG_CONFIG="document:INFO,WARNING"
DEFAULT_LOG_CONFIG = "INFO"


class MyFormatter(logging.Formatter):
    def format(self, record):
        contextID = None
        documentID = None
        if hasattr(record, 'contextID'):
            contextID = record.contextID
        if hasattr(record, 'documentID'):
            documentID = record.documentID
        source = "AuthoringService"
        level = record.levelname
        subSource = record.name
        message = logging.Formatter.format(self, record)
        logmessage = repr('"' + message)
        if logmessage[0] == 'u':
            logmessage = logmessage[1:]
        logmessage = "'" + logmessage[2:]

        rvList = ['2-Immerse']
        if source:
            rvList.append('source:%s' % source)
        if subSource:
            rvList.append('subSource:%s' % subSource)
        if level:
            rvList.append('level:%s' % level)
        if contextID:
            rvList.append('contextID:%s' % contextID)
        if documentID:
            rvList.append('documentID:%s' % documentID)
        if hasattr(record, 'xpath'):
            rvList.append('xpath:%s ' % repr(record.xpath))
        if hasattr(record, 'dmappcID'):
            rvList.append('dmappcID:%s ' % record.dmappcID)
        rvList.append('sourcetime:%s' % datetime.datetime.fromtimestamp(time.time()).isoformat())
        rvList.append('logmessage:%s' % logmessage)
        return ' '.join(rvList)


class MyLoggerAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        if 'extra' in kwargs:
            kwargs['extra'].update(self.extra)
        else:
            kwargs['extra'] = self.extra

        return msg, kwargs


def install(noKibana=False, logLevel=DEFAULT_LOG_CONFIG):
    if noKibana:
        currentFormatterClass = logging.Formatter
    else:
        currentFormatterClass = MyFormatter
    if logLevel:
        for ll in logLevel.split(','):
            if ':' in ll:
                loggerToModify = logging.getLogger(ll.split(':')[0])
                newLevel = getattr(logging, ll.split(':')[1])
            else:
                loggerToModify = logging.getLogger()
                newLevel = getattr(logging, ll)
            loggerToModify.setLevel(newLevel)

    rootLogger = logging.getLogger()
    rootLogger.handlers[0].setFormatter(currentFormatterClass())


# Send stdout and stderr to the logger as well.
class StreamToLogger(object):
   def __init__(self, logger, log_level=logging.INFO):
      self.logger = logger
      self.log_level = log_level
      self.linebuf = ''

   def write(self, buf):
      for line in buf.rstrip().splitlines():
         self.logger.log(self.log_level, line.rstrip())

sys.stdout = StreamToLogger(logging.getLogger('stdout'), logging.INFO)
sys.stderr = StreamToLogger(logging.getLogger('stderr'), logging.INFO)
