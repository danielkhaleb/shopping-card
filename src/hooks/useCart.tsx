import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  const checkProductIsOnStock = async (productId: number, requestedAmount: number) => {
    const {data: stock} = await api.get<Stock>(`/stock/${productId}`)
    
    return stock.amount >= requestedAmount
  }

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(p => p.id === productId)
      updateProductAmount({amount: (product?.amount || 0)+1, productId})
    } catch {
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(p => p.id !== productId);
      if (newCart.length === cart.length) {
        // eslint-disable-next-line no-throw-literal
        throw 'Esse produto nao existe';
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    let newCart
    try {
      if (!await checkProductIsOnStock(productId, amount)) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const {data: product} = await api.get<Product>(`/products/${productId}`)
      if(!product) {
        toast.error('Erro na adição do produto');
        return
      }
      if(cart.some(p => p.id === productId)) {
        newCart = cart.map(p => {
          if (p.id === productId) {
            p.amount = amount;
          }
          return p;
        })
        setCart(newCart)
      }else {
        newCart = [...cart, {...product, amount: 1}]
        setCart(newCart)
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };



  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
