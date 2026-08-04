import { describe, it, expect, vi } from 'vitest';
import { ProgressEmitter } from '@/lib/core/pipeline/progress-emitter';

describe('ProgressEmitter', () => {
  it('should_emit_event_to_registered_listener', () => {
    const emitter = new ProgressEmitter();
    const listener = vi.fn();
    emitter.on('run-1', listener);
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'started' });
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'step_start' }));
  });

  it('should_replay_buffered_events_on_subscribe', () => {
    const emitter = new ProgressEmitter();
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'first' });
    emitter.emit('run-1', { type: 'step_complete', step: 'Test', message: 'second' });
    const listener = vi.fn();
    emitter.on('run-1', listener);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ message: 'first' }));
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ message: 'second' }));
  });

  it('should_buffer_events_when_no_listener', () => {
    const emitter = new ProgressEmitter();
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'buffered' });
    const listener = vi.fn();
    emitter.on('run-1', listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ message: 'buffered' }));
  });

  it('should_not_call_listener_after_unsubscribe', () => {
    const emitter = new ProgressEmitter();
    const listener = vi.fn();
    const unsubscribe = emitter.on('run-1', listener);
    unsubscribe();
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'after unsubscribe' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should_remove_listener_and_buffer_on_unsubscribe_when_last_listener', () => {
    const emitter = new ProgressEmitter();
    const listener = vi.fn();
    const unsubscribe = emitter.on('run-1', listener);
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'before' });
    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(1);
    const newListener = vi.fn();
    emitter.on('run-1', newListener);
    expect(newListener).not.toHaveBeenCalled();
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'after' });
    expect(newListener).toHaveBeenCalledTimes(1);
  });

  it('should_remove_all_listeners_and_buffers_for_run_id', () => {
    const emitter = new ProgressEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('run-1', listener1);
    emitter.on('run-2', listener2);
    emitter.removeAll('run-1');
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'removed' });
    emitter.emit('run-2', { type: 'step_start', step: 'Test', message: 'kept' });
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('should_deliver_to_multiple_listeners_for_same_run', () => {
    const emitter = new ProgressEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('run-1', listener1);
    emitter.on('run-1', listener2);
    emitter.emit('run-1', { type: 'step_start', step: 'Test', message: 'broadcast' });
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('should_not_emit_to_wrong_run_id', () => {
    const emitter = new ProgressEmitter();
    const listener = vi.fn();
    emitter.on('run-1', listener);
    emitter.emit('run-2', { type: 'step_start', step: 'Test', message: 'wrong run' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should_limit_buffer_to_max_buffered_events', () => {
    const emitter = new ProgressEmitter();
    for (let i = 0; i < 600; i++) {
      emitter.emit('run-1', { type: 'step_progress', step: 'Test', message: `event-${i}` });
    }
    const listener = vi.fn();
    emitter.on('run-1', listener);
    expect(listener).toHaveBeenCalledTimes(500);
  });

  it('should_not_fail_when_emitting_with_no_listeners_and_no_buffer_cleanup_needed', () => {
    const emitter = new ProgressEmitter();
    emitter.emit('new-run', { type: 'step_start', step: 'Test', message: 'no listeners' });
    expect(true).toBe(true);
  });
});
