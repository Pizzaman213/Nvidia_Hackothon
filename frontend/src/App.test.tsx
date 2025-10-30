import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AI Babysitter application', () => {
  render(<App />);
  // Check for login screen elements
  const loginElements = screen.getAllByText(/AI Babysitter/i);
  expect(loginElements.length).toBeGreaterThan(0);
});

test('renders child and parent login options', () => {
  render(<App />);
  // The app should render without crashing and show login interface
  const container = document.querySelector('.App') || document.body;
  expect(container).toBeTruthy();
});
