import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import DatasetDetail from './pages/DatasetDetail';
import About from './pages/About';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/dataset/:id" element={<DatasetDetail />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}

export default App;
