import React, { useState } from 'react';
import { Product, formatCurrency } from '../../types/payment';
import { paymentAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { 
  CheckIcon, 
  StarIcon,
  CreditCardIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface ProductCardProps {
  product: Product;
  onPurchase?: () => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onPurchase, 
  className = '' 
}) => {
  const [isLoading] = useState(false);

  const handlePurchase = async () => {
    toast.error('Payments are currently unavailable in your region.');
  };

  const isSubscription = product.type === 'subscription';
  const isPopular = product.id === 'sub_quarterly' || product.id === 'tokens_10';

  return (
    <div className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
      isPopular ? 'border-blue-500' : 'border-gray-200'
    } ${className}`}>
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
            <StarIcon className="h-4 w-4 mr-1" />
            Most Popular
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            {isSubscription ? (
              <SparklesIcon className="h-8 w-8 text-purple-600" />
            ) : (
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm">{product.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(product.price, product.currency)}
          </div>
          {product.type === 'subscription' && (
            <div className="text-sm text-gray-500 mt-1">
              per {product.duration === 30 ? 'month' : 'quarter'}
            </div>
          )}
          {product.type === 'lesson_tokens' && (
            <div className="text-sm text-gray-500 mt-1">
              {product.quantity} lessons
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mb-6">
          <ul className="space-y-3">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payments disabled notice */}
        <div className="mb-6">
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Payments are currently unavailable in your region.
          </div>
        </div>

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors duration-200 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : isSubscription
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Buy ${product.name}`
          )}
        </button>

        {/* Security notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Payments are disabled.</p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 