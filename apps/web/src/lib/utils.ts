export function getProductImageUrl(product: { id: string; image_url: string }): string {
  if (!product.image_url) return '';
  if (product.image_url.startsWith('http://') || product.image_url.startsWith('https://')) {
    return product.image_url;
  }
  if (product.image_url.startsWith('data:')) {
    return product.image_url;
  }
  return `/api/products/${product.id}/image`;
}
