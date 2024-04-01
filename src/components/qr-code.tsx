import { useQRCode } from 'next-qrcode';

export default function QRCode({data,width}:{ data:string, width: number }) {
  const { Image } = useQRCode();

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      text={data}
      options={{
        type: 'image/jpeg',
        quality: 1,
        errorCorrectionLevel: 'M',
        margin: 3,
        scale: 4,
        width: !!width ? width : 200,
        color: {
          dark: '#000',
          light: '#FFFFFF',
        },
      }}
    />
  );
};