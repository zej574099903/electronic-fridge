import * as FileSystem from 'expo-file-system/legacy';

const PHOTO_DIRECTORY = `${FileSystem.documentDirectory ?? ''}item-photos/`;

export async function persistPhotoUri(sourceUri: string) {
  if (!sourceUri || !FileSystem.documentDirectory) {
    return sourceUri;
  }

  if (sourceUri.startsWith(PHOTO_DIRECTORY)) {
    return sourceUri;
  }

  await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, { intermediates: true });

  const extension = sourceUri.match(/\.(\w+)(?:\?|$)/)?.[1] ?? 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const destination = `${PHOTO_DIRECTORY}${fileName}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destination,
  });

  return destination;
}
