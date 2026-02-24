import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Line Chart Component
export function LineChart({ data, options, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    ...options,
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Line data={data} options={defaultOptions} />
    </div>
  )
}

// Bar Chart Component
export function BarChart({ data, options, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    ...options,
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Bar data={data} options={defaultOptions} />
    </div>
  )
}

// Pie Chart Component
export function PieChart({ data, options, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    ...options,
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Pie data={data} options={defaultOptions} />
    </div>
  )
}

// Doughnut Chart Component
export function DoughnutChart({ data, options, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    ...options,
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Doughnut data={data} options={defaultOptions} />
    </div>
  )
}

// Area Chart Component (Line chart with filled area)
export function AreaChart({ data, options, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      filler: {
        propagate: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
      },
    },
    ...options,
  }

  // Ensure fill is set on datasets
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      fill: dataset.fill !== undefined ? dataset.fill : true,
    })),
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Line data={chartData} options={defaultOptions} />
    </div>
  )
}
