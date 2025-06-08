'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function OptionsTracker() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('options_trades')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) console.error('Fetch error:', error)
      else setTrades(data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async () => {
    const required = ['symbol', 'strike_price', 'premium']
    if (required.some(f => !formData[f])) {
      alert('Symbol, Strike Price, and Premium are required.')
      return
    }

    let apr = null
    if (formData.status === 'CLOSED' && formData.date_closed) {
      const capital = +formData.strike_price * +formData.contracts * 100
      const net = +formData.premium - (+formData.fees || 0)
      const days = Math.max(1, (new Date(formData.date_closed) - new Date()) / 86400000)
      apr = ((net / capital) * (365 / days) * 100).toFixed(2)
    }

    const trade = {
      ...formData,
      strike_price: +formData.strike_price,
      premium: +formData.premium,
      contracts: +formData.contracts,
      fees: formData.fees ? +formData.fees : 0,
      apr: apr ? +apr : null
    }

    const { data, error } = await supabase
      .from('options_trades')
      .insert([trade])
      .select()

    if (error) {
      console.error('Insert error:', error)
      alert('Error adding trade.')
    } else {
      setTrades([...data, ...trades])
      setFormData({
        symbol: '', option_type: 'PUT', strike_price: '', expiration_date: '',
        premium: '', contracts: '1', action: 'SELL', status: 'OPEN', fees: '', date_closed: ''
      })
      setShowForm(false)
    }
  }

  const calculateAPR = (trade) => {
    if (trade.status !== 'CLOSED' || !trade.date_closed) return null
    const capital = trade.strike_price * trade.contracts * 100
    const net = trade.premium - (trade.fees || 0)
    const days = Math.max(1, (new Date(trade.date_closed) - new Date(trade.created_at)) / 86400000)
    return ((net / capital) * (365 / days) * 100).toFixed(2)
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
  const formatDate = (date) => new Date(date).toLocaleDateString()

  if (loading) return <div className="flex justify-center items-center h-screen">Loading trades...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Options Tracker</h1>
      <button onClick={() => setShowForm(!showForm)} className="mb-6 px-4 py-2 bg-blue-600 text-white rounded">
        {showForm ? 'Cancel' : 'Add Trade'}
      </button>

      {showForm && (
        <div className="bg-white shadow p-4 rounded mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {['symbol', 'strike_price', 'expiration_date', 'premium', 'contracts', 'fees', 'date_closed'].map((field) => (
              <input
                key={field}
                name={field}
                type={field.includes('date') ? 'date' : 'text'}
                value={formData[field] || ''}
                placeholder={field.replace('_', ' ').toUpperCase()}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            ))}
            {['option_type', 'action', 'status'].map((field) => (
              <select key={field} name={field} value={formData[field]} onChange={handleChange} className="border p-2 rounded">
                {field === 'option_type' && ['PUT', 'CALL'].map(v => <option key={v} value={v}>{v}</option>)}
                {field === 'action' && ['SELL', 'BUY'].map(v => <option key={v} value={v}>{v}</option>)}
                {field === 'status' && ['OPEN', 'CLOSED', 'EXPIRED', 'ASSIGNED'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ))}
          </div>
          <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Submit</button>
        </div>
      )}

      <table className="min-w-full bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            {['Symbol', 'Type', 'Strike', 'Exp.', 'Premium', 'Contracts', 'Action', 'Status', 'APR', 'Date'].map(h => (
              <th key={h} className="text-left px-4 py-2 text-sm font-semibold text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-4 py-2 font-bold">{t.symbol}</td>
              <td className="px-4 py-2">{t.option_type}</td>
              <td className="px-4 py-2">{formatCurrency(t.strike_price)}</td>
              <td className="px-4 py-2">{formatDate(t.expiration_date)}</td>
              <td className="px-4 py-2">{formatCurrency(t.premium)}</td>
              <td className="px-4 py-2">{t.contracts}</td>
              <td className="px-4 py-2">{t.action}</td>
              <td className="px-4 py-2">{t.status}</td>
              <td className="px-4 py-2 text-green-600">{t.apr || calculateAPR(t) || '-'}</td>
              <td className="px-4 py-2 text-gray-400">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}