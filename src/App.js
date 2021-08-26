import { CreateStream } from "./views/CreateStream";
import { StopStream } from "./views/StopStream";
import { WithdrawFromStream } from "./views/WithdrawFromStream";

import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import AppBar from '@material-ui/core/AppBar';
import { useState } from "react";


function App() {
  const [tabValue, setTabValue] = useState(0);

  function a11yProps(index) {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  }

  function handleTabChange(event, newValue) {
    setTabValue(newValue);
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Payment Streams">
          <Tab label="Create Stream" {...a11yProps(0)} />
          <Tab label="Stop Stream" {...a11yProps(1)} />
          <Tab label="Withdraw from Stream" {...a11yProps(2)} />
        </Tabs>
      </AppBar>

      {tabValue === 0 && (<CreateStream />)}
      {tabValue === 1 && (<StopStream />)}
      {tabValue === 2 && (<WithdrawFromStream />)}

    </div>
  );
}

export default App;
