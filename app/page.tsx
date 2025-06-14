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
                value={form
