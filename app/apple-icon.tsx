import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 108,
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#22c55e',
          fontFamily: 'monospace',
        }}
      >
        &gt;
      </div>
    ),
    {
      ...size,
    }
  );
}
