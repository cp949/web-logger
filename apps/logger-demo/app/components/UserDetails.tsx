'use client';

import { useEffect, useState } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

export default function UserDetails() {
  const logger = useWebLogger('[UserDetails]');
  const [count, setCount] = useState(0);

  useEffect(() => {
    logger.info('UserDetails component mounted');
    logger.debug('Initial state', { count: 0 });

    return () => {
      logger.info('UserDetails component unmounted');
    };
  }, [logger]);

  useEffect(() => {
    logger.debug('Count changed', { count, previousCount: count - 1 });
  }, [count, logger]);

  const handleIncrement = () => {
    setCount((prev) => prev + 1);
    logger.info('Count incremented', { newCount: count + 1 });
  };

  const handleError = () => {
    try {
      throw new Error('Simulated error for testing');
    } catch (error) {
      logger.error('Error occurred in UserDetails', error, {
        component: 'UserDetails',
        action: 'handleError',
      });
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>UserDetails Component</h3>
      <p>This component uses useWebLogger('[UserDetails]')</p>
      <p>Check console for logs prefixed with [UserDetails]</p>
      <p>Count: {count}</p>
      <div className="button-group">
        <button className="button" onClick={handleIncrement}>
          Increment (Log Info)
        </button>
        <button className="button" onClick={handleError}>
          Simulate Error
        </button>
      </div>
    </div>
  );
}
