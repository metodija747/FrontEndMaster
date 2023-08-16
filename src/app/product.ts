export interface Product {
  productId: string;
  AverageRating: number;
  categoryName: string;
  imageURL: string;
  Price: number;
  productName: string;
  commentsCount: number;
  beautifulComment: string;
  Description: string;
  discountPrice: number;
  isUpdatingQuantity?: boolean;

}
export interface CartProduct extends Product {
  totalProductPrice: number;
  quantity: number;
}
