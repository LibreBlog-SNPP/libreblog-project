import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0c2b4d 0%, #36234e 50%, #5f638f 100%)',
          borderRadius: '6px',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 512 512"
          fill="white"
        >
          <path d="M465.5 466.1c12.1-12.1 22.2-22.1 22.4-22.1.9 0-.9 12.8-2.4 17-5.1 14.5-19 24.7-36.2 26.6l-5.8.6 22-22.1z" />
          <path d="M314 375.3c-66.3-56.9-120.7-103.9-120.9-104.5-.3-1 80.7-82.8 82.1-82.8.5 0 46.8 53.7 102.9 119.3 56.2 65.5 102.9 120 103.7 121 1.5 1.7 0 3.4-22.9 26.1l-24.4 24.4-120.5-103.5z" />
          <path d="M144.6 205.3l-36.8-53.6 24.3-24.3 24.4-24.4 53.8 37.2 53.8 37.1-40.8 40.9c-22.4 22.4-41 40.8-41.3 40.7-.3 0-17.1-24.1-37.4-53.6z" />
          <path d="M82.3 118.1l-26.2-19.6-.6-4.5c-3.9-27.9-12.8-49.7-26.7-65.5l-4.2-4.8 4.1 2.6c7.6 4.8 21.8 11.6 29.8 14.2 11.9 4 20 5.5 30.1 5.5l9.1 0 21.9 28.5c12 15.6 22 29 22.2 29.7.1.8-7.3 8.6-16.6 17.5l-16.8 16.1-26.1-19.7zm4.3-36c10.1-6.2 2.9-21.7-8.3-18-10.8 3.5-8.3 19.5 3.2 19.8 1.1.1 3.4-.8 5.1-1.8z" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
