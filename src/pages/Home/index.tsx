import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    const sumAmountNew = { ...sumAmount };
    sumAmountNew[product.id] = product.amount;

    return sumAmountNew;
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() {
      const productsRequest = await api.get<Product[]>(`/products`)
      setProducts(productsRequest.data.map<ProductFormatted>(p => {
        return { priceFormatted: formatPrice(p.price), ...p }
      }))
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {products.map(p =>
        <li key={p.id}>
          <img src={p.image} alt={p.title} />
          <strong>{p.title}</strong>
          <span>{p.priceFormatted}</span>
          <button
            type="button"
            data-testid="add-product-button"
            onClick={() => handleAddProduct(p.id)}
          >
            <div data-testid="cart-product-quantity">
              <MdAddShoppingCart size={16} color="#FFF" />
              {cartItemsAmount[p.id] || 0} 
            </div>

            <span>ADICIONAR AO CARRINHO</span>
          </button>
        </li>
      )}
    </ProductList>
  );
};

export default Home;
