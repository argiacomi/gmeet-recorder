import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { LOG_LOCATIONS, logger } from '../logger/logger.js';

import './popup.css';

const sendLog = (...log) => logger(LOG_LOCATIONS.Popup, ...log);

const Popup = () => {
  const [tab, setTab] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(async () => {
    try {
      sendLog('Popup mounted');
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      sendLog('Active tab:', activeTab);
      setTab(activeTab);

      await checkRecordingStatus();
      chrome.runtime.onMessage.addListener(handleMessage);
    } catch (error) {
      sendLog('Error in useEffect:', error);
    }
    return () => {
      sendLog('Popup unmounted');
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleMessage = (message) => {
    if (message.type === 'recording-started') {
      sendLog('Setting isRecording to true');
      setIsRecording(true);
    } else if (message.type === 'recording-stopped' || message.type === 'recording-failed') {
      sendLog('Setting isRecording to false');
      setIsRecording(false);
    }
  };

  const checkRecordingStatus = async () => {
    try {
      sendLog('Checking recording status');
      const result = await chrome.runtime.sendMessage({ type: 'get-recording-status' });
      sendLog('Recording status:', result);
      setIsRecording(result.isRecording);
      setIsPaused(result.isPaused);
      return true;
    } catch (error) {
      sendLog('Error checking recording status:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      await chrome.runtime.sendMessage({
        tabId: tab.id,
        type: 'start-recording'
      });
      return true;
    } catch (error) {
      sendLog('Error starting recording:', error);
      return false;
    }
  };

  const toggleRecording = async () => {
    try {
      await chrome.runtime.sendMessage({
        tabId: tab.id,
        type: 'toggle-recording'
      });
      return true;
    } catch (error) {
      sendLog('Error toggling recording:', error);
      return false;
    }
  };
  const stopRecording = async () => {
    try {
      await chrome.runtime.sendMessage({
        tabId: tab.id,
        target: 'call-recorder',
        type: 'stop-recording'
      });
      return true;
    } catch (error) {
      console.error(error);
      sendLog('Error stopping recording:', error);
      return false;
    }
  };

  return (
    <div>
      {isRecording ? (
        <>
          <button id='button' onClick={toggleRecording} style={{ backgroundColor: isPaused ? '#28a745' : '#ffc107' }}>
            {isPaused ? 'Resume Recording' : 'Pause Recording'}
          </button>
          <button id='button' onClick={stopRecording} style={{ backgroundColor: '#dc3545' }}>
            Stop Recording
          </button>
        </>
      ) : (
        <button id='button' onClick={startRecording}>
          Start Recording
        </button>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
