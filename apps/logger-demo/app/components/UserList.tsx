'use client';

import { useEffect } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

export default function UserList() {
  const logger = useWebLogger('[UserList]');

  useEffect(() => {
    logger.info('UserList component mounted');
    logger.debug('UserList debug info', { component: 'UserList' });

    return () => {
      logger.info('UserList component unmounted');
    };
  }, [logger]);

  const handleClick = () => {
    logger.info('User list clicked');
    logger.debug('Click event details', { timestamp: Date.now() });
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>UserList Component</h3>
      <p>This component uses useWebLogger('[UserList]')</p>
      <p>Check console for logs prefixed with [UserList]</p>
      <button className="button" onClick={handleClick}>
        Click to Log
      </button>
    </div>
  );
}
