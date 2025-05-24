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

  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import moment from 'moment'

export default {
  name: 'ParkingDashboard',
  data() {
    return {
      allTransactions: [],
      parkingSlots: [],
      monthlyTotalRevenue: 0,
      activeVehicles: 0,
      monthlyTransactionCount: 0,
      occupancyRate: 0,
      occupiedCount: 0,
      availableCount: 0,
      statusFilter: '',
      tableLoading: false,
      transactionColumns: [
        { 
          title: 'Record Code', 
          key: 'record_id',
          width: 100,
          fixed: 'left',
          render: (h, { row }) => h('span', { class: 'record-code' }, `#${row.record_id}`)
        },
        { 
          title: 'Plate Number', 
          key: 'numberplate_number',
          ellipsis: true
        },
        { 
          title: 'Slot', 
          key: 'slotLabel',
          width: 70
        },
        {
          title: 'Time In',
          render: (h, { row }) => h('span', moment(row.time_in).format('MMM DD, HH:mm'))
        },
        {
          title: 'Time Out',
          render: (h, { row }) => {
            if (row.time_out) {
              return h('span', moment(row.time_out).format('MMM DD, HH:mm'))
            }
            return h('span', { class: 'still-parked' }, 'Still Parked')
          }
        },
        {
          title: 'Duration',
          width: 80,
          render: (h, { row }) => {
            if (row.duration_minutes) {
              const hours = Math.floor(row.duration_minutes / 60)
              const minutes = row.duration_minutes % 60
              return h('span', `${hours}h ${minutes}m`)
            }
            return h('span', { class: 'in-progress' }, 'In Progress')
          }
        },
        {
          title: 'Fee',
          width: 90,
          render: (h, { row }) => {
            if (row.total_fee) {
              return h('span', { class: 'fee-amount' }, `₱${Number(row.total_fee).toLocaleString()}`)
            }
            return h('span', { class: 'fee-pending' }, 'Pending')
          }
        },
        {
          title: 'Status',
          width: 80,
          render: (h, { row }) => {
            const statusClass = row.status === 'active' ? 'status-active' : 'status-completed'
            return h('span', { class: statusClass }, row.status.toUpperCase())
          }
        },
        { 
          title: 'Processed By', 
          key: 'processed_by',
          ellipsis: true
        },
        { 
          title: 'Vehicle ID', 
          key: 'vehicle_id',
          width: 90,
          ellipsis: true
        },
      ],
    }
  },
  computed: {
    filteredTransactions() {
      if (!this.statusFilter) {
        return this.allTransactions
      }
      return this.allTransactions.filter(transaction => 
        transaction.status === this.statusFilter
      )
    }
  },
  methods: {
    async fetchAllTransactions() {
      this.tableLoading = true
      try {
        // First, try to fetch with slots join
        const { data, error } = await supabase
          .from('parking_records')
          .select(`*, slots(slot_label)`)
          .order('record_id', { ascending: false })

        if (!error && data) {
          this.allTransactions = data.map(record => ({
            ...record,
            slotLabel: record.slots?.slot_label || `Slot ${record.slot_id}`,
          }))
        } else {
          // If join fails, fetch without join
          console.warn('Fetch with slots join failed, trying without join:', error)
          const { data: simpleData, error: simpleError } = await supabase
            .from('parking_records')
            .select('*')
            .order('record_id', { ascending: false })

          if (!simpleError && simpleData) {
            this.allTransactions = simpleData.map(record => ({
              ...record,
              slotLabel: `Slot ${record.slot_id}`,
            }))
          } else {
            console.error('Error fetching transactions:', simpleError)
            this.$Message.error('Failed to fetch parking transactions')
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        this.$Message.error('An unexpected error occurred while fetching data')
      }
      this.tableLoading = false
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
      try {
        const startOfMonth = moment().startOf('month').format('YYYY-MM-DD')
        const endOfMonth = moment().endOf('month').format('YYYY-MM-DD')

        console.log('Fetching stats for date range:', startOfMonth, 'to', endOfMonth)

        // First, let's try to get ALL revenue data to see what we have
        const { data: allRevenueData, error: allRevenueError } = await supabase
          .from('parking_records')
          .select('total_fee, time_in, status')
          .not('total_fee', 'is', null)

        console.log('All revenue data:', allRevenueData)

        if (!allRevenueError && allRevenueData) {
          // Calculate total revenue for current month
          const monthlyRevenue = allRevenueData.filter(record => {
            const recordDate = moment(record.time_in)
            return recordDate.isBetween(startOfMonth, endOfMonth, 'day', '[]')
          })
          
          console.log('Monthly revenue records:', monthlyRevenue)
          this.monthlyTotalRevenue = monthlyRevenue.reduce((acc, curr) => acc + (parseFloat(curr.total_fee) || 0), 0)
          this.monthlyTransactionCount = monthlyRevenue.length
        } else {
          console.error('Error fetching revenue data:', allRevenueError)
          
          // Fallback: try without date filtering to see if there's any data at all
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('parking_records')
            .select('total_fee')
            .not('total_fee', 'is', null)
            .limit(5)

          console.log('Fallback data check:', fallbackData)
          
          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            // If we have revenue data but date filtering failed, show total revenue
            this.monthlyTotalRevenue = fallbackData.reduce((acc, curr) => acc + (parseFloat(curr.total_fee) || 0), 0)
            this.monthlyTransactionCount = fallbackData.length
            console.log('Using fallback data - Total revenue:', this.monthlyTotalRevenue)
          }
        }

        // Active vehicles (currently parked)
        const { data: activeData, error: activeError } = await supabase
          .from('parking_records')
          .select('record_id')
          .eq('status', 'active')

        if (!activeError && activeData) {
          this.activeVehicles = activeData.length
          console.log('Active vehicles:', this.activeVehicles)
        } else {
          console.error('Error fetching active vehicles:', activeError)
        }

      } catch (err) {
        console.error('Unexpected error in fetchMonthlyStats:', err)
      }
    },
    updateOccupancyStats() {
      this.occupiedCount = this.parkingSlots.filter(slot => slot.status === 'occupied').length
      this.availableCount = this.parkingSlots.filter(slot => slot.status === 'vacant').length
      const totalSlots = this.occupiedCount + this.availableCount
      this.occupancyRate = totalSlots > 0 ? (this.occupiedCount / totalSlots) * 100 : 0
    },
    refreshTransactions() {
      this.fetchAllTransactions()
      this.$Message.success('Transactions refreshed successfully')
    },
    async testData() {
      console.log('=== TESTING DATA ===')
      
      // Test basic connection
      const { data: testConnection, error: connectionError } = await supabase
        .from('parking_records')
        .select('*')
        .limit(1)

      console.log('Connection test:', { data: testConnection, error: connectionError })

      // Count total records
      const { count, error: countError } = await supabase
        .from('parking_records')
        .select('*', { count: 'exact', head: true })

      console.log('Total records count:', { count, error: countError })

      // Check for records with fees
      const { data: feeData, error: feeError } = await supabase
        .from('parking_records')
        .select('total_fee, time_in, status')
        .not('total_fee', 'is', null)
        .limit(5)

      console.log('Records with fees:', { data: feeData, error: feeError })

      // Check for active records
      const { data: activeData, error: activeError } = await supabase
        .from('parking_records')
        .select('*')
        .eq('status', 'active')
        .limit(3)

      console.log('Active records:', { data: activeData, error: activeError })

      this.$Message.info('Check browser console for test results')
    }
  },
  mounted() {
    // Add some debugging
    console.log('Dashboard mounted, fetching data...')
    this.fetchAllTransactions()
    this.fetchParkingSlots()
    this.fetchMonthlyStats()

    this.refreshInterval = setInterval(() => {
      this.fetchAllTransactions()
      this.fetchParkingSlots()
      this.fetchMonthlyStats()
    }, 60000)
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  }
}
</script>

<style scoped>
.dashboard-wrapper {
  padding: 16px;
  min-height: 100vh;
  overflow-y: auto;
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
  min-height: 300px;
  height: auto;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 10px;
  min-height: 200px;
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
  min-height: 250px;
  padding: 20px;
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

.dashboard-latest {
  margin-top: 16px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.table-container .ivu-table {
  width: 100% !important;
  min-width: 100%;
}

.table-container .ivu-table-wrapper {
  width: 100% !important;
}

.table-container .ivu-table tbody td {
  white-space: nowrap;
}

.table-controls {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-controls {
  display: flex;
  align-items: center;
}

/* Enhanced table styling */
.record-code {
  font-weight: bold;
  color: #1890ff;
  background-color: #f0f9ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.status-active {
  color: #fa8c16;
  background-color: #fff7e6;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 11px;
}

.status-completed {
  color: #52c41a;
  background-color: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 11px;
}

.still-parked {
  color: #fa8c16;
  font-style: italic;
}

.in-progress {
  color: #fa8c16;
  font-style: italic;
}

.fee-amount {
  color: #52c41a;
  font-weight: bold;
}

.data-info {
  font-size: 12px;
  color: #666;
}

.debug-info {
  margin-top: 16px;
  padding: 16px;
  background-color: #fff7e6;
  border: 1px solid #ffec99;
  border-radius: 4px;
  color: #d48806;
}
</style>