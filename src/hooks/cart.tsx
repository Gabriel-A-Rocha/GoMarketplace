import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (loadedProducts) {
        const parsedProducts = JSON.parse(loadedProducts);
        setProducts(parsedProducts);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const updatedList = products.map(product => {
        if (id === product.id) {
          const updatedProduct = {
            ...product,
            quantity: product.quantity + 1,
          };

          return updatedProduct;
        }
        return product;
      });

      setProducts(updatedList);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedList),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>): Promise<void> => {
      const searchCart = products.find(({ id }) => product.id === id);

      // product is not in the cart yet
      if (!searchCart) {
        const newProduct: Product = {
          ...product,
          quantity: 1,
        };

        const updatedList = [...products, newProduct];
        setProducts(updatedList);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(updatedList),
        );
      } else {
        await increment(product.id);
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const updatedList = products.map(product => {
        if (id === product.id) {
          return {
            ...product,
            quantity: product.quantity - 1,
          };
        }
        return product;
      });

      // remove products with 0 quantity
      const filteredList = updatedList.filter(product => product.quantity > 0);

      setProducts(filteredList);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(filteredList),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
