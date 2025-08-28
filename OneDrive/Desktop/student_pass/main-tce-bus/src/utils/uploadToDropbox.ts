// src/utils/uploadToDropbox.ts

export async function uploadToDropbox(file: File): Promise<string> {
  const ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN
  if (!ACCESS_TOKEN) throw new Error('Dropbox access token is missing.');

  const filename = file.name;
  const path = `/student_photos/${Date.now()}_${filename}`;
  const arrayBuffer = await file.arrayBuffer();

  // Upload file to Dropbox
  const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path,
        mode: 'add',
        autorename: true,
        mute: false,
      }),
    },
    body: arrayBuffer,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('❌ Dropbox upload failed:', errorText);
    throw new Error('Upload to Dropbox failed');
  }

  // Try creating a shared link
  let sharedLinkUrl: string | null = null;

  const sharedLinkRes = await fetch(
    'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        settings: { requested_visibility: 'public' },
      }),
    }
  );

  const sharedLinkData = await sharedLinkRes.json();

  if (sharedLinkRes.ok) {
    sharedLinkUrl = sharedLinkData.url;
  } else if (sharedLinkData?.error?.['.tag'] === 'shared_link_already_exists') {
    // Fallback: Get existing link
    const fallbackRes = await fetch(
      'https://api.dropboxapi.com/2/sharing/list_shared_links',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, direct_only: true }),
      }
    );
    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok && fallbackData.links?.[0]?.url) {
      sharedLinkUrl = fallbackData.links[0].url;
    }
  }

  if (!sharedLinkUrl) {
    console.error('❌ Could not create or fetch Dropbox shared link');
    throw new Error('Failed to generate Dropbox link');
  }

  return sharedLinkUrl.replace('?dl=0', '?raw=1'); // ✅ For direct image display
}
