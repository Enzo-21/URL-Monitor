import { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios'

function App() {
  const [monitoredURL, setMonitoredURL] = useState<string | null>(null);
  const [currentURL, setCurrentURL] = useState<string | null>(null);
  const [monitoringIntervalId, setMonitoringIntervalId] = useState<any>(null);

  useEffect(() => {
    // Retrieve the monitored URL from storage when the component mounts
    chrome.storage.sync.get(['monitoredURL'], (result) => {
      setMonitoredURL(result.monitoredURL || null);
    });

    // Get the current tab URL when the component mounts
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        setCurrentURL(tabs[0].url);
      }
    });

    // Add an event listener to update the monitored URL when the tab URL changes
    const handleTabUpdate = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.url) {
        setCurrentURL(changeInfo.url);
        // Save the monitored URL to storage
        chrome.storage.sync.set({ monitoredURL: changeInfo.url });
      }
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);

    // Clean up the event listener when the component unmounts
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, []); // Empty dependency array to run the effect only once

  useEffect(() => {
    // Check if the URLs are different every 10 seconds
    const intervalId = setInterval(async () => {
      if (currentURL && monitoredURL && currentURL !== monitoredURL) {
        const message = `❌❌❌ Monitoring URL Alert!!! ❌❌❌\n Expected URL: ${monitoredURL}\n Current URL: ${currentURL}`
        console.log(message)
        await axios.get(`http://localhost:4000/api/disconnected/${message}`)
        stopMonitor()
        // You can add additional logic here for handling the difference
      }
    }, 10000); // 10 seconds

    // Save the intervalId to state for cleanup
    setMonitoringIntervalId(intervalId);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [currentURL, monitoredURL]);

  const startMonitor = () => {
    // Set the monitored URL only if it's currently null
    if (monitoredURL === null) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
          setMonitoredURL(tabs[0].url);
          // Save the monitored URL to storage
          chrome.storage.sync.set({ monitoredURL: tabs[0].url });
        }
      });
    }
  };

  const stopMonitor = () => {
    // Clear the monitored URL and the monitoring interval
    chrome.tabs.query({ active: true, currentWindow: true }, (_tabs) => {
      setMonitoredURL(null);
      // Save the monitored URL to storage
      chrome.storage.sync.set({ monitoredURL: null });
    });
    setMonitoredURL(null);
    clearInterval(monitoringIntervalId);
    setMonitoringIntervalId(null);
  };

  return (
    <>
      <div className="logo">
        <h1>🦄</h1>
      </div>
      <div className="card">
        {monitoredURL ? (
          <>
            <div className="url">Monitored url: {monitoredURL}</div>
            <div className="url">Current url: {currentURL}</div>
            <div onClick={stopMonitor} className="url">
              Stop Monitoring
            </div>
          </>
        ) : (
          <div onClick={startMonitor} className="url url-start">
            Start Monitoring
          </div>
        )}
      </div>
    </>
  );
}

export default App;
