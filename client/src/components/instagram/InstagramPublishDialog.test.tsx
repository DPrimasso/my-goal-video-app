import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstagramPublishDialog } from './InstagramPublishDialog';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('InstagramPublishDialog', () => {
  it('mantiene disponibile la condivisione manuale senza endpoint configurato', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('png', { status: 200, headers: { 'Content-Type': 'image/png' } }),
    ));
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="" />);
    expect(screen.queryByRole('button', { name: /pubblica come storia/i })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /aggiungi musica e tag/i })).toBeEnabled());
  });

  it('condivide il PNG per completare la Storia in Instagram senza chiedere il PIN', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('png', { status: 200, headers: { 'Content-Type': 'image/png' } }),
    ));
    vi.stubGlobal('navigator', { ...navigator, share, canShare: vi.fn(() => true) });
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="https://publisher.test" />);

    fireEvent.click(await screen.findByRole('button', { name: /aggiungi musica e tag/i }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const sharedFile = (share.mock.calls[0][0] as ShareData).files?.[0];
    expect(sharedFile).toBeInstanceOf(File);
    expect(sharedFile).toMatchObject({ name: 'casalpoglio-storia.png', type: 'image/png' });
    expect(screen.queryByLabelText(/pin di pubblicazione/i)).not.toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent(/scegli Instagram, poi Storia/i);
  });

  it('richiede PIN e conferma prima della pubblicazione', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('png', { status: 200, headers: { 'Content-Type': 'image/png' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'STORY_PUBLISHED', message: 'ok', mediaId: 'media' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetchMock);
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="https://publisher.test" />);

    fireEvent.click(await screen.findByRole('button', { name: /pubblica come storia/i }));
    const publishButton = screen.getByRole('button', { name: /pubblica ora/i });
    expect(publishButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/pin di pubblicazione/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(publishButton).toBeEnabled();
    fireEvent.click(publishButton);

    await waitFor(() => expect(screen.getByRole('button', { name: /pubblicata su instagram/i })).toBeDisabled());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('crea una chiave diversa soltanto con Pubblica di nuovo', async () => {
    const publishedResponse = () => new Response(JSON.stringify({
      code: 'STORY_PUBLISHED', message: 'ok', mediaId: crypto.randomUUID(),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('png', { status: 200, headers: { 'Content-Type': 'image/png' } }))
      .mockImplementation(async () => publishedResponse());
    vi.stubGlobal('fetch', fetchMock);
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="https://publisher.test" />);

    fireEvent.click(await screen.findByRole('button', { name: /pubblica come storia/i }));
    fireEvent.change(screen.getByLabelText(/pin di pubblicazione/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /pubblica ora/i }));
    await screen.findByRole('button', { name: /pubblica di nuovo/i });
    const firstKey = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;

    fireEvent.click(screen.getByRole('button', { name: /pubblica di nuovo/i }));
    expect(screen.getByLabelText(/pin di pubblicazione/i)).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    fireEvent.change(screen.getByLabelText(/pin di pubblicazione/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /pubblica ora/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const secondKey = (fetchMock.mock.calls[2][1] as RequestInit).headers as Record<string, string>;
    expect(secondKey['X-Idempotency-Key']).not.toBe(firstKey['X-Idempotency-Key']);
  });

  it('ripristina la pubblicazione dopo il remount della stessa grafica', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('png', { status: 200, headers: { 'Content-Type': 'image/png' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'STORY_PUBLISHED', message: 'ok', mediaId: 'media' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response('png', { status: 200, headers: { 'Content-Type': 'image/png' } }));
    vi.stubGlobal('fetch', fetchMock);
    const firstRender = render(<InstagramPublishDialog imageUrl="blob:image" endpoint="https://publisher.test" />);
    fireEvent.click(await screen.findByRole('button', { name: /pubblica come storia/i }));
    fireEvent.change(screen.getByLabelText(/pin di pubblicazione/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /pubblica ora/i }));
    await screen.findByRole('button', { name: /pubblicata su instagram/i });

    firstRender.unmount();
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="https://publisher.test" />);
    await screen.findByRole('button', { name: /pubblicata su instagram/i });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('richiede un nuovo tentativo esplicito dopo un esito incerto', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('png', { status: 200, headers: { 'Content-Type': 'image/png' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 'PUBLISH_STATUS_UNKNOWN', message: 'Controlla Instagram prima di riprovare.',
      }), { status: 409, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    render(<InstagramPublishDialog imageUrl="blob:image" endpoint="https://publisher.test" />);

    fireEvent.click(await screen.findByRole('button', { name: /pubblica come storia/i }));
    fireEvent.change(screen.getByLabelText(/pin di pubblicazione/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /pubblica ora/i }));

    await screen.findByRole('button', { name: /ho controllato: nuovo tentativo/i });
    expect(JSON.stringify(sessionStorage)).not.toContain('12345678');
    fireEvent.click(screen.getByRole('button', { name: /ho controllato: nuovo tentativo/i }));
    expect(screen.getByLabelText(/pin di pubblicazione/i)).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
