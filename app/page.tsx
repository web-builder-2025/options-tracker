"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface OptionsTrade {
  id: number;
  created_at: string;
  symbol: string;
  option_type: string;
  strike_price: number;
  expiration_date: string;
  premium: number;
  contracts: number;
  action: string;
  status: string;
  fees: number;
  date_closed: string | null;
  apr: number | null;
}

export default function OptionsTradesPage() {
  const [trades, setTrades] = useState<OptionsTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  async function fetchTrades() {
    try {
      const { data, error } = await supabase
        .from('options_trades')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching trades:', error);
        setError('Failed to fetch trades');
      } else {
        setTrades(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching trades:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading trades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Options Trades</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Symbol</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Strike</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Expiration</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Premium</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Contracts</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Action</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">APR</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  {trade.symbol}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trade.option_type === 'PUT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {trade.option_type}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {formatCurrency(trade.strike_price)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {formatDate(trade.expiration_date)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {formatCurrency(trade.premium)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {trade.contracts}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trade.action === 'SELL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {trade.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trade.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                    trade.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {trade.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={`font-medium ${
                    trade.apr !== null ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {formatPercentage(trade.apr)}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {formatDate(trade.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trades.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trades found.
        </div>
      )}
    </div>
  );
}
