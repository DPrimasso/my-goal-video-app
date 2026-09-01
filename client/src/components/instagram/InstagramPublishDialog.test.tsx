import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstagramPublishDialog } from './InstagramPublishDialog';

afterEach(() => vi.restoreAllMocks());

describe('InstagramPublishDialog', () => {
  it('resta nascosto senza endpoint configurato', () => {
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="" />);
    expect(screen.queryByRole('button', { name: /pubblica come storia/i })).not.toBeInTheDocument();
  });

  it('richiede PIN e conferma prima della pubblicazione', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(new Blob(['png'], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'STORY_PUBLISHED', message: 'ok', mediaId: 'media' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetchMock);
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="https://publisher.test" />);

    fireEvent.click(screen.getByRole('button', { name: /pubblica come storia/i }));
    const publishButton = screen.getByRole('button', { name: /pubblica ora/i });
    expect(publishButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/pin di pubblicazione/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(publishButton).toBeEnabled();
    fireEvent.click(publishButton);

    await waitFor(() => expect(screen.getByRole('button', { name: /pubblicata su instagram/i })).toBeDisabled());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
