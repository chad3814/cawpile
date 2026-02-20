/**
 * Tests for About page
 * Task Group 5.1: About page tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutPage from '@/app/about/page';

describe('About Page', () => {
  test('should render Book Roast credit text', () => {
    render(<AboutPage />);

    expect(screen.getByText('Created by Book Roast')).toBeInTheDocument();
    expect(
      screen.getByText(/The CAWPILE rating system was created by/i)
    ).toBeInTheDocument();
  });

  test('should render YouTube channel link with correct href and target="_blank"', () => {
    render(<AboutPage />);

    const channelLink = screen.getByRole('link', { name: /book roast/i });
    expect(channelLink).toBeInTheDocument();
    expect(channelLink).toHaveAttribute(
      'href',
      'https://www.youtube.com/@BookRoast'
    );
    expect(channelLink).toHaveAttribute('target', '_blank');
    expect(channelLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should render CAWPILE playlist link with correct href and rel attributes', () => {
    render(<AboutPage />);

    const playlistLink = screen.getByRole('link', { name: /cawpile playlist/i });
    expect(playlistLink).toBeInTheDocument();
    expect(playlistLink).toHaveAttribute(
      'href',
      'https://www.youtube.com/playlist?list=PL3V6H7y0QuPPNa_DRxClpQ5XU1E-vZpJA'
    );
    expect(playlistLink).toHaveAttribute('target', '_blank');
    expect(playlistLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should render CAWPILE acronym breakdown', () => {
    render(<AboutPage />);

    expect(screen.getByText('What is CAWPILE?')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Atmosphere')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Plot')).toBeInTheDocument();
    expect(screen.getByText('Intrigue')).toBeInTheDocument();
    expect(screen.getByText('Logic')).toBeInTheDocument();
    expect(screen.getByText('Enjoyment')).toBeInTheDocument();
  });

  test('should render page heading and description', () => {
    render(<AboutPage />);

    expect(screen.getByText('About CAWPILE')).toBeInTheDocument();
    expect(
      screen.getByText('A comprehensive book rating system for thoughtful readers')
    ).toBeInTheDocument();
  });
});
