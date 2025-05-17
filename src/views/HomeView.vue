<template>
  <div class="dashboard-wrapper">
    <Card title="Parking Overview" class="dashboard-metrics">
      <Row :gutter="16">
        <Col span="8">
        <Card class="stat-card stat-sales" dis-hover>
          <h3>Total Revenue</h3>
          <p class="stat-value">₱ {{ monthlyTotalRevenue.toLocaleString() }}</p>
        </Card>
        </Col>
        <Col span="8">
        <Card class="stat-card stat-quantity" dis-hover>
          <h3>Active Vehicles</h3>
          <p class="stat-value">{{ activeVehicles }}</p>
        </Card>
        </Col>
        <Col span="8">
        <Card class="stat-card stat-count" dis-hover>
          <h3>Total Transactions</h3>
          <p class="stat-value">{{ monthlyTransactionCount }}</p>
        </Card>
        </Col>
      </Row>
    </Card>

    <Row :gutter="16" class="slot-status-section">
      <Col span="12">
        <Card title="Parking Slot Status" class="dashboard-slots">
          <div class="slot-grid">
            <div 
              v-for="slot in parkingSlots" 
              :key="slot.slot_id" 
              :class="['parking-slot', { 'occupied': slot.status === 'occupied', 'available': slot.status === 'available' }]"
            >
              {{ slot.slot_label }}
            </div>
          </div>
        </Card>
      </Col>
      <Col span="12">
        <Card title="Slot Occupancy" class="dashboard-chart">
          <div class="chart-container">
            <Progress type="circle" :percent="occupancyRate" :stroke-width="8">
              <span class="progress-text">
                {{ Math.round(occupancyRate) }}% Occupied
              </span>
            </Progress>
            <div class="occupancy-legend">
              <div class="legend-item">
                <div class="color-dot occupied-dot"></div>
                <span>Occupied: {{ occupiedCount }}</span>
              </div>
              <div class="legend-item">
                <div class="color-dot available-dot"></div>
                <span>Available: {{ availableCount }}</span>
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <Card title="Recent Parking Transactions" class="dashboard-latest">
      <Table :columns="transactionColumns" :data="latestTransactions" border />
    </Card>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import moment from 'moment'
// Using view-design's Chart component instead of importing echarts

export default {
  name: 'ParkingDashboard',
  data() {
    return {
      latestTransactions: [],
      parkingSlots: [],
      monthlyTotalRevenue: 0,
      activeVehicles: 0,
      monthlyTransactionCount: 0,
      occupancyRate: 0,
      occupiedCount: 0,
      availableCount: 0,
      transactionColumns: [
        { title: 'Plate Number', key: 'numberplate_number' },
        { title: 'Slot', key: 'slotLabel' },
        { 
          title: 'Time In', 
          render: (h, { row }) => h('span', moment(row.time_in).format('MMM DD, YYYY HH:mm'))
        },
        { 
          title: 'Time Out', 
          render: (h, { row }) => {
            if (row.time_out) {
              return h('span', moment(row.time_out).format('MMM DD, YYYY HH:mm'))
            }
            return h('span', 'Still Parked')
          }
        },
        { 
          title: 'Duration', 
          render: (h, { row }) => {
            if (row.duration_minutes) {
              const hours = Math.floor(row.duration_minutes / 60)
              const minutes = row.duration_minutes % 60
              return h('span', `${hours}h ${minutes}m`)
            }
            return h('span', 'In Progress')
          }
        },
        { 
          title: 'Fee', 
          render: (h, { row }) => {
            if (row.total_fee) {
              return h('span', `₱ ${Number(row.total_fee).toLocaleString()}`)
            }
            return h('span', 'Pending')
          }
        },
        { 
          title: 'Status', 
          render: (h, { row }) => {
            const statusClass = row.status === 'active' ? 'status-active' : 'status-completed'
            return h('span', { class: statusClass }, row.status)
          }
        },
      ],
    }
  },
  methods: {
    async fetchLatestTransactions() {
      const { data, error } = await supabase
        .from('parking_records')
        .select(`*, slots(slot_label)`)
        .order('time_in', { ascending: false })
        .limit(5)

      if (!error && data) {
        this.latestTransactions = data.map(record => ({
          ...record,
          slotLabel: record.slots?.slot_label || `Slot ${record.slot_id}`,
        }))
      } else {
        console.error('Error fetching transactions:', error)
      }
    },
    async fetchParkingSlots() {
      const { data, error } = await supabase
        .from('parking_slots')
        .select('*')
        .order('slot_id', { ascending: true })

      if (!error && data) {
        this.parkingSlots = data
        this.updateOccupancyStats()
      } else {
        console.error('Error fetching parking slots:', error)
      }
    },
    async fetchMonthlyStats() {
      const startOfMonth = moment().startOf('month').format('YYYY-MM-DD')
      const endOfMonth = moment().endOf('month').format('YYYY-MM-DD')

      // Get completed transactions for the month
      const { data: completedData, error: completedError } = await supabase
        .from('parking_records')
        .select('total_fee')
        .gte('time_in', startOfMonth)
        .lte('time_in', endOfMonth)
        .not('total_fee', 'is', null)

      if (!completedError && completedData) {
        this.monthlyTotalRevenue = completedData.reduce((acc, curr) => acc + Number(curr.total_fee), 0)
        this.monthlyTransactionCount = completedData.length
      }

      // Get active vehicles (status = 'active')
      const { data: activeData, error: activeError } = await supabase
        .from('parking_records')
        .select('record_id')
        .eq('status', 'active')

      if (!activeError && activeData) {
        this.activeVehicles = activeData.length
      }
    },
    updateOccupancyStats() {
      // Count occupied and available slots
      this.occupiedCount = this.parkingSlots.filter(slot => slot.status === 'occupied').length
      this.availableCount = this.parkingSlots.filter(slot => slot.status === 'available').length
      
      const totalSlots = this.occupiedCount + this.availableCount
      this.occupancyRate = totalSlots > 0 ? (this.occupiedCount / totalSlots) * 100 : 0
    },
  },
  mounted() {
    this.fetchLatestTransactions()
    this.fetchParkingSlots()
    this.fetchMonthlyStats()
    
    // Set up auto-refresh every minute
    this.refreshInterval = setInterval(() => {
      this.fetchLatestTransactions()
      this.fetchParkingSlots()
      this.fetchMonthlyStats()
    }, 60000)
    
    // Handle window resize for chart
    window.addEventListener('resize', () => {
      if (this.slotChart) {
        this.slotChart.resize()
      }
    })
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style scoped>
.dashboard-wrapper {
  padding: 16px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}

.stat-sales {
  background-color: #e6f7ff;
  color: #1890ff;
}

.stat-quantity {
  background-color: #f6ffed;
  color: #52c41a;
}

.stat-count {
  background-color: #fff1f0;
  color: #f5222d;
}

.slot-status-section {
  margin: 16px 0;
}

.dashboard-slots,
.dashboard-chart {
  height: 300px;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 10px;
}

.parking-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
}

.parking-slot.occupied {
  background-color: #ff7875;
  color: white;
}

.parking-slot.available {
  background-color: #b7eb8f;
  color: #135200;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.progress-text {
  font-size: 14px;
  font-weight: bold;
}

.occupancy-legend {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.occupied-dot {
  background-color: #ff7875;
}

.available-dot {
  background-color: #52c41a;
}

.status-active {
  color: #fa8c16;
  background-color: #fff7e6;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-completed {
  color: #52c41a;
  background-color: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
}

.dashboard-latest {
  margin-top: 16px;
}
</style>