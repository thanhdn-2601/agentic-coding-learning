'use client';

import Image from 'next/image';
import type { ImageProps } from 'next/image';

type ClientImageProps = Omit<ImageProps, 'onError'> & {
  /** Hide the image element when it fails to load (default: false) */
  hideOnError?: boolean;
  /** Set opacity to 0.3 when image fails to load (default: false) */
  dimOnError?: boolean;
};

export default function ClientImage({ hideOnError, dimOnError, ...props }: ClientImageProps) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (hideOnError) el.style.display = 'none';
    if (dimOnError) el.style.opacity = '0.3';
  };

  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} onError={handleError} />;
}
