import { CHART_COLORS } from './colors';

export const CHART_CONFIG = {
  // Responsive container settings
  responsive: {
    width: '100%',
    height: 300,
  },

  // Default margins for charts
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },

  // Bar chart specific settings
  barChart: {
    barGap: 4,
    barCategoryGap: '20%',
    animationDuration: 500,
  },

  // Pie chart specific settings
  pieChart: {
    innerRadius: 0,
    outerRadius: 80,
    paddingAngle: 2,
    animationDuration: 500,
    labelLine: false,
  },

  // Tooltip settings
  tooltip: {
    contentStyle: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '8px 12px',
    },
    labelStyle: {
      color: CHART_COLORS.text,
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: CHART_COLORS.textSecondary,
    },
  },

  // Grid settings
  grid: {
    strokeDasharray: '3 3',
    stroke: CHART_COLORS.grid,
  },

  // Axis settings
  axis: {
    tick: {
      fill: CHART_COLORS.textSecondary,
      fontSize: 12,
    },
    axisLine: {
      stroke: CHART_COLORS.grid,
    },
  },

  // Animation settings
  animation: {
    duration: 500,
    easing: 'ease-out',
  },

  // Max items before grouping into "Other"
  maxPieSegments: 7,

  // Default empty state message
  emptyStateMessage: 'No data available for this period',
} as const;