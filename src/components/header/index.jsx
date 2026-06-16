import React,{useState} from 'react'
import Header from "./header"
import SideDrawer from './drawer';

const Index = () => {

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <SideDrawer
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

    </>
  );
  
}

export default Index