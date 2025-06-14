'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Define the Trade interface
interface Trade {
  id: number;
  symbol: string;
  option_type: 'PUT' | 'CALL';
  strike_price: number;
  expiration_date: string;
  premium: number;
  contracts: number;
  action: 'SELL' | 'BUY';
  status: 'OPEN' | 'CLOSED' | 'EXPIRED' | 'ASSIGNED';
  fees: number;
  apr: number | null;
  date_closed: string | null;
  created_at: string;
}

export default function OptionsTracker() {
  const [trades, setTrades] = useState<any[]>([]) // Fixed: properly again
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    option_type: 'PUT',
    strike_price: '',
    expiration_date: '',
    premium: '',
    contracts: '1',
    action: 'SELL',
    status: 'OPEN',
    fees: '',
    date_closed: ''
  })

  // Fetch trades on component mount
  useEffect(() => {
    fetchTrades()
  }, [])

  async function fetchTrades() {
    const { data, error } = await supabase
      .from('options_trades')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching trades:', error)
    } else {
      setTrades(data || [])
    }
    setLoading(false)
  }

  async function addTrade() {
    if (!formData.symbol || !formData.strike_price || !formData.premium) {
      alert('Please fill in Symbol, Strike Price, and Premium')
      return
    }

    try {
      // Calculate APR if trade is closed
      let apr = null
      if (formData.status === 'CLOSED' && formData.date_closed) {
        const capitalRequired = parseFloat(formData.strike_price) * parseInt(formData.contracts) * 100
        const netPremium = parseFloat(formData.premium) - parseFloat(formData.fees || '0')
        const createdDate = new Date()
        const closedDate = new Date(formData.date_closed)
        const daysHeld = Math.max(1, Math.ceil((closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
        
        apr = ((netPremium / capitalRequired) * (365 / daysHeld) * 100).toFixed(2)
      }

      // Prepare trade data with proper type conversion
      const tradeData = {
        symbol: formData.symbol.toUpperCase(),
        option_type: formData.option_type,
        strike_price: parseFloat(formData.strike_price),
        expiration_date: formData.expiration_date || null, // Convert empty string to null
        premium: parseFloat(formData.premium),
        contracts: parseInt(formData.contracts),
        action: formData.action,
        status: formData.status,
        fees: formData.fees ? parseFloat(formData.fees) : 0,
        apr: apr ? parseFloat(apr) : null,
        date_closed: (formData.status === 'CLOSED' && formData.date_closed) ? formData.date_closed : null
      }

      console.log('Attempting to insert trade data:', tradeData)

      const { data, error } = await supabase
        .from('options_trades')
        .insert([tradeData])
        .select()
      
      if (error) {
        console.error('Supabase error details:', error)
        alert(`Error adding trade: ${error.message}`)
        return
      }

      console.log('Successfully added trade:', data)
      
      // Update the trades list
      setTrades([...data, ...trades])
      
      // Reset form
      setFormData({
        symbol: '',
        option_type: 'PUT',
        strike_price: '',
        expiration_date: '',
        premium: '',
        contracts: '1',
        action: 'SELL',
        status: 'OPEN',
        fees: '',
        date_closed: ''
      })
      setShowForm(false)
      
    } catch (error: any) {
      console.error('Unexpected error:', error)
      alert(`Unexpected error: ${error.message}`)
    }
  }

  function calculateAPR(trade: Trade) {
    if (trade.status !== 'CLOSED' || !trade.date_closed) return null
    
    const capitalRequired = trade.strike_price * trade.contracts * 100
    const netPremium = trade.premium - (trade.fees || 0)
    const createdDate = new Date(trade.created_at)
    const closedDate = new Date(trade.date_closed)
    const daysHeld = Math.max(1, Math.ceil((closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    return ((netPremium / capitalRequired) * (365 / daysHeld) * 100).toFixed(2)
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading your options trades...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Options Tracker</h1>
          <p className="text-gray-600">Track your options trades and calculate APR</p>
        </div>

        {/* Add Trade Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            {showForm ? 'Cancel' : 'Add New Trade'}
          </button>
        </div>

        {/* Add Trade Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Options Trade</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  placeholder="AAPL"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.option_type}
                  onChange={(e) => setFormData({...formData, option_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="PUT">PUT</option>
                  <option value="CALL">CALL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Strike Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.strike_price}
                  onChange={(e) => setFormData({...formData, strike_price: e.target.value})}
                  placeholder="150.00"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Premium ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.premium}
                  onChange={(e) => setFormData({...formData, premium: e.target.value})}
                  placeholder="200.00"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contracts</label>
                <input
                  type="number"
                  value={formData.contracts}
                  onChange={(e) => setFormData({...formData, contracts: e.target.value})}
                  placeholder="1"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Action</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({...formData, action: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="SELL">SELL</option>
                  <option value="BUY">BUY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fees ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fees}
                  onChange={(e) => setFormData({...formData, fees: e.target.value})}
                  placeholder="2.50"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {formData.status === 'CLOSED' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Date Closed</label>
                  <input
                    type="date"
                    value={formData.date_closed}
                    onChange={(e) => setFormData({...formData, date_closed: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={addTrade}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 mr-3"
              >
                Add Trade
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Trades Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Your Options Trades</h2>
          </div>
          
          {trades.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No trades yet. Add your first options trade above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strike</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contracts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">APR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{trade.symbol}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.option_type === 'PUT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {trade.option_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatCurrency(trade.strike_price)}</td>
                      <td className="px-6 py-4">{formatDate(trade.expiration_date)}</td>
                      <td className="px-6 py-4">{formatCurrency(trade.premium)}</td>
                      <td className="px-6 py-4">{trade.contracts}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.action === 'SELL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                          trade.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {trade.apr ? (
                          <span className="font-medium text-green-600">{trade.apr}%</span>
                        ) : trade.status === 'CLOSED' ? (
                          <span className="font-medium text-green-600">{calculateAPR(trade)}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(trade.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {trades.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Total Trades</h3>
              <p className="text-3xl font-bold text-blue-600">{trades.length}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Open Positions</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {trades.filter(t => t.status === 'OPEN').length}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Total Premium</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(trades.reduce((sum, t) => sum + (t.premium || 0), 0))}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Avg APR (Closed)</h3>
              <p className="text-3xl font-bold text-purple-600">
                {(() => {
                  const closedTrades = trades.filter(t => t.status === 'CLOSED' && (t.apr || calculateAPR(t)))
                  if (closedTrades.length === 0) return 'N/A'
                  const avgAPR = closedTrades.reduce((sum, t) => sum + (t.apr || parseFloat(calculateAPR(t) || '0')), 0) / closedTrades.length
                  return avgAPR.toFixed(1) + '%'
                })()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
