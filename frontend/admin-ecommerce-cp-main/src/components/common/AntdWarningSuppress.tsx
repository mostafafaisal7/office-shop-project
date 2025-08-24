'use client';

import { useEffect } from 'react';

export default function AntdWarningSuppress() {
  useEffect(() => {
    // Suppress Antd React version warning
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' && 
        (message.includes('antd v5 support React is 16 ~ 18') ||
         message.includes('antd: compatible'))
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' && 
        (message.includes('antd v5 support React is 16 ~ 18') ||
         message.includes('antd: compatible') ||
         message.includes('`value` is not a valid prop, do you mean `fileList`?') ||
         message.includes('Static function can not consume context like dynamic theme') ||
         message.includes('There may be circular references') ||
         message.includes('circular reference') ||
         message.includes('[antd: Spin] `tip` only work in nest or fullscreen pattern') ||
         message.includes('[antd: Card] `bodyStyle` is deprecated') ||
         message.includes('[antd: Form.Item] A `Form.Item` with a `name` prop must have a single child element') ||
         message.includes('[antd: Form.Item] `children` is array of render props cannot have `name`') ||
         message.includes('Instance created by `useForm` is not connected to any Form element') ||
         message.includes('useForm` is not connected to any Form element') ||
         message.includes('[antd: Modal] `destroyOnClose` is deprecated. Please use `destroyOnHidden` instead') ||
         message.includes('[antd: Dropdown] `overlay` is deprecated. Please use `menu` instead') ||
         message.includes('Can\'t call setState on a component that is not yet mounted') ||
         message.includes('setState on a component that is not yet mounted') ||
         message.includes('This is a no-op, but it might indicate a bug in your application'))
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
