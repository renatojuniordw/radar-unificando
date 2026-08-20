// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  BotIcon,
  UserIcon,
  ChatIcon,
  HistoryIcon,
  ExternalLinkIcon,
  PlusIcon,
} from '@/components/chat/icons';

describe('Chat Icons', () => {
  it('should render BotIcon', () => {
    const { container } = render(<BotIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('should render UserIcon', () => {
    const { container } = render(<UserIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.getAttribute('height')).toBe('16');
  });

  it('should render ChatIcon', () => {
    const { container } = render(<ChatIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('should render HistoryIcon', () => {
    const { container } = render(<HistoryIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('should render ExternalLinkIcon', () => {
    const { container } = render(<ExternalLinkIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('14');
    expect(svg?.getAttribute('height')).toBe('14');
  });

  it('should render PlusIcon', () => {
    const { container } = render(<PlusIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('should render all icons with correct viewBox', () => {
    const icons = [
      <BotIcon key="bot" />,
      <UserIcon key="user" />,
      <ChatIcon key="chat" />,
      <HistoryIcon key="history" />,
      <ExternalLinkIcon key="external" />,
      <PlusIcon key="plus" />,
    ];

    icons.forEach((icon) => {
      const { container } = render(icon);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  it('should render all icons with stroke attributes', () => {
    const icons = [
      <BotIcon key="bot" />,
      <UserIcon key="user" />,
      <ChatIcon key="chat" />,
      <HistoryIcon key="history" />,
      <ExternalLinkIcon key="external" />,
      <PlusIcon key="plus" />,
    ];

    icons.forEach((icon) => {
      const { container } = render(icon);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('stroke')).toBe('currentColor');
      expect(svg?.getAttribute('stroke-width')).toBe('2');
      expect(svg?.getAttribute('stroke-linecap')).toBe('round');
      expect(svg?.getAttribute('stroke-linejoin')).toBe('round');
    });
  });
});
