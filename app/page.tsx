'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function OptionsTracker() {
  const [trades, setTrades] = useState([])
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
    // Calculate APR if trade is closed
    let apr = null
    if (formData.status === 'CLOSED' && formData.date_closed) {
      const capitalRequired = parseFloat(formData.strike_price) * parseInt(formData.contracts) * 100
      const netPremium = parseFloat(formData.premium) - parseFloat(formData.fees || 0)
      const createdDate = new Date()
      const closedDate = new Date(formData.date_closed)
      const daysHeld = Math.max(1, (closedDate - createdDate) / (1000 * 60 * 60 * 24))
      
      if (capitalRequired > 0 && daysHeld > 0) {
        apr = ((netPremium / capitalRequired) * (365 / daysHeld) * 100)
      }
    }

    const { data, error } = await supabase
      .from('options_trades')
      .insert([{
        ...formData,
        strike_price: parseFloat(formData.strike_price),
        premium: parseFloat(formData.premium),
        contracts: parseInt(formData.contracts),
        fees: parseFloat(formData.fees || 0),
        apr: apr
      }])
      .select()
    
    if (error) {
      console.error('Error adding trade:', error)
      alert('Error adding trade. Check console for details.')
    } else {
      setTrades([...data, ...trades])
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
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  function calculateDisplayAPR(trade) {
    if (trade.status !== 'CLOSED' || !trade.date_closed) return 'N/A'
    
    const capitalRequired = trade.strike_price * trade.contracts * 100
    const netPremium = trade.premium - (trade.fees || 0)
    const createdDate = new Date(trade.created_at)
    const closedDate = new Date(trade.date_closed)
    const daysHeld = Math.max(1, (closedDate - createdDate) / (1000 * 60 * 60 * 24))
    
    if (capitalRequired > 0 && daysHeld > 0) {
      const apr = ((netPremium / capitalRequired) * (365 / daysHeld) * 100)
      return apr.toFixed(2) + '%'
    }
    return 'N/A'
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) return <div className="p-8">Loading your trades...</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Options Tracker</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : 'Add Trade'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border">
          <h2 className="text-xl font-semibold mb-4">Add New Options Trade</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="AAPL"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="option_type"
                value={formData.option_type}
                onChange={handleInputChange}
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
                name="strike_price"
                value={formData.strike_price}
                onChange={handleInputChange}
                placeholder="150.00"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date</label>
              <input
                type="date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Premium</label>
              <input
                type="number"
                name="premium"
                value={formData.premium}
                onChange={handleInputChange}
                placeholder="2.50"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Contracts</label>
              <input
                type="number"
                name="contracts"
                value={formData.contracts}
                onChange={handleInputChange}
                placeholder="1"
                min="1"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                name="action"
                value={formData.action}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="SELL">SELL</option>
                <option value="BUY">BUY</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fees</label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                placeholder="0.65"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            {formData.status === 'CLOSED' && (
              <div>
                <label className="block text-sm font-medium mb-1">Date Closed</label>
                <input
                  type="date"
                  name="date_closed"
                  value={formData.date_closed}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
          </div>
          
          <button
            onClick={addTrade}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Add Trade
          </button>
        </div>
      )}

      {/* Trades Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Symbol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Strike</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Expiry</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Premium</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contracts</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">APR</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trades.map((trade, index) => (
                <tr key={index} className={trade.status === 'CLOSED' ? 'bg-green-50' : 'bg-white'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{trade.symbol}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{trade.option_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(trade.strike_price)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(trade.expiration_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(trade.premium)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{trade.contracts}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{trade.action}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.status === 'OPEN' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{calculateDisplayAPR(trade)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(trade.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {trades.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No trades yet. Click "Add Trade" to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
