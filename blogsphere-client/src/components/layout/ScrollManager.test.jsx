import React, { useState, useEffect } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import ScrollManager from './ScrollManager';

// Home shows its "trending" section only after a (simulated) API call
const Home = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div>
      <Link to="/">Home link</Link>
      {loaded && <section id="trending">Trending</section>}
    </div>
  );
};

let navigateRef;
const NavGrab = () => { navigateRef = useNavigate(); return null; };

const renderAt = (entries, index) => render(
  <MemoryRouter initialEntries={entries} initialIndex={index ?? entries.length - 1}>
    <ScrollManager />
    <NavGrab />
    <Link to="/about">About link</Link>
    <Link to="/#trending">Trending link</Link>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<p>About page</p>} />
    </Routes>
  </MemoryRouter>
);

// Advance fake time in small steps so React renders between timers (as in a browser)
const flush = (ms = 50) => {
  for (let t = 0; t < ms; t += 50) act(() => { jest.advanceTimersByTime(Math.min(50, ms - t)); });
};

beforeEach(() => {
  jest.useFakeTimers();
  window.scrollTo = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
  window.matchMedia = undefined;
});
afterEach(() => {
  jest.useRealTimers();
});

test('does not scroll on the first load without a hash', () => {
  renderAt(['/about']);
  flush(100);
  expect(window.scrollTo).not.toHaveBeenCalled();
});

test('a link to another page scrolls to the top smoothly', () => {
  renderAt(['/']);
  fireEvent.click(screen.getByText('About link'));
  flush();
  expect(screen.getByText('About page')).toBeInTheDocument();
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
});

test('clicking a link to the current page scrolls back to the top', () => {
  renderAt(['/about']);
  fireEvent.click(screen.getByText('About link'));
  flush();
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
});

test('a #hash link waits for the section to render, then scrolls to it', () => {
  renderAt(['/about']);
  fireEvent.click(screen.getByText('Trending link'));
  flush(100);
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  flush(1000); // section appears after the simulated API call
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  expect(Element.prototype.scrollIntoView.mock.instances[0].id).toBe('trending');
});

test('browser back/forward (POP) is left to the browser', () => {
  renderAt(['/', '/about'], 1);
  act(() => { navigateRef(-1); });
  flush(1500);
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
});

test('opening a URL with a #hash scrolls to the section on first load', () => {
  renderAt(['/#trending']);
  flush(1200);
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});

test('reduced motion scrolls instantly', () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  renderAt(['/']);
  fireEvent.click(screen.getByText('About link'));
  flush();
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
});
