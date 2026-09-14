import pb from '@/lib/pocketbaseClient';

export async function getContent(key, fallback = null) {
    try {
        const record = await pb
            .collection('site_content')
            .getFirstListItem(pb.filter('key = {:k}', { k: key }));
        return record.value ?? fallback;
    } catch {
        return fallback;
    }
}

export function listCms(collection, options = {}) {
    return pb.collection(collection).getFullList({ sort: 'created', ...options });
}

export const FALLBACK_IMAGE =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZDNjN2IyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzViNDMzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBlYXJsIG9mIEFmcmljYSBUcmF2ZWw8L3RleHQ+PC9zdmc+';

export function img(src) {
    return src && typeof src === 'string' && src.length > 4 ? src : FALLBACK_IMAGE;
}
