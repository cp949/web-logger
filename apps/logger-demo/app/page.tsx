'use client';

import { useState } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';
import {
  logDebug,
  logInfo,
  logWarn,
  logError,
  setLogLevel,
  getLogLevel,
} from '@cp949/web-logger';
import UserList from './components/UserList';
import UserDetails from './components/UserDetails';

export default function Home() {
  const [logLevel, setCurrentLogLevel] = useState<string>(getLogLevel());

  const handleSetLogLevel = (level: string) => {
    setLogLevel(level as any);
    setCurrentLogLevel(getLogLevel());
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Web Logger Demo</h1>
        <p>
          Demo application for @cp949/web-logger and @cp949/web-logger-react
        </p>
        <div className="info">
          <p>
            <strong>Current Log Level:</strong> {logLevel}
          </p>
          <p>
            Open your browser console to see the log output with automatic
            sensitive data filtering.
          </p>
        </div>
      </div>

      <div className="section">
        <h2>1. Direct Function Usage</h2>
        <p>Using log functions directly from @cp949/web-logger:</p>
        <div className="code-block">
          <code>
            {`import { logDebug, logInfo, logWarn, logError } from '@cp949/web-logger';

logDebug('Debug message');
logInfo('Info message');
logWarn('Warning message');
logError('Error message');`}
          </code>
        </div>
        <div className="button-group">
          <button
            className="button"
            onClick={() => logDebug('This is a debug message', { userId: 123 })}
          >
            Debug
          </button>
          <button
            className="button"
            onClick={() =>
              logInfo('User logged in', {
                userId: 456,
                email: 'user@example.com',
              })
            }
          >
            Info
          </button>
          <button
            className="button"
            onClick={() =>
              logWarn('Rate limit approaching', { remaining: 10 })
            }
          >
            Warn
          </button>
          <button
            className="button"
            onClick={() =>
              logError('Failed to fetch data', new Error('Network error'))
            }
          >
            Error
          </button>
        </div>
      </div>

      <div className="section">
        <h2>2. React Hook Usage (useWebLogger)</h2>
        <p>Using useWebLogger hook from @cp949/web-logger-react:</p>
        <div className="code-block">
          <code>
            {`import { useWebLogger } from '@cp949/web-logger-react';

function MyComponent() {
  const logger = useWebLogger('[MyComponent]');
  
  logger.info('Component mounted');
}`}
          </code>
        </div>
        <UserList />
        <UserDetails />
      </div>

      <div className="section">
        <h2>3. Sensitive Data Filtering</h2>
        <p>
          The logger automatically filters sensitive data like emails, phone
          numbers, passwords, etc.
        </p>
        <div className="code-block">
          <code>
            {`logInfo('User data:', {
  email: 'user@example.com',  // → [EMAIL]
  phone: '010-1234-5678',     // → [PHONE]
  password: 'secret123',      // → [REDACTED]
  card: '1234-5678-9012-3456' // → [CARD]
});`}
          </code>
        </div>
        <div className="button-group">
          <button
            className="button"
            onClick={() =>
              logInfo('User registration', {
                email: 'newuser@example.com',
                phone: '010-1234-5678',
                password: 'mySecretPassword',
                creditCard: '1234-5678-9012-3456',
              })
            }
          >
            Test Sensitive Data Filtering
          </button>
        </div>
      </div>

      <div className="section">
        <h2>4. Log Level Control</h2>
        <p>Change the log level dynamically:</p>
        <div className="code-block">
          <code>
            {`import { setLogLevel, getLogLevel } from '@cp949/web-logger';

setLogLevel('warn'); // Only warn and error will be shown
setLogLevel('debug'); // All logs will be shown`}
          </code>
        </div>
        <div className="button-group">
          <button
            className="button"
            onClick={() => handleSetLogLevel('debug')}
          >
            Debug (All)
          </button>
          <button
            className="button"
            onClick={() => handleSetLogLevel('info')}
          >
            Info
          </button>
          <button
            className="button"
            onClick={() => handleSetLogLevel('warn')}
          >
            Warn
          </button>
          <button
            className="button"
            onClick={() => handleSetLogLevel('error')}
          >
            Error
          </button>
          <button
            className="button"
            onClick={() => handleSetLogLevel('none')}
          >
            None
          </button>
        </div>
      </div>
    </div>
  );
}

