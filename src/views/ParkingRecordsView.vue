<template>
  <div class="transaction-wrapper">
    <Card title="All Parking Records" class="transaction-list">
      <Table :columns="parkingColumns" :data="parkingRecords" border />
    </Card>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import moment from 'moment'

export default {
  name: 'AllParkingRecords',
  data() {
    return {
      parkingRecords: [],
      parkingColumns: [
        { title: 'Record ID', key: 'record_id', width: 100 },
        { title: 'Slot ID', key: 'slot_id' },
        {
          title: 'Time In',
          render: (h, { row }) =>
            h('span', moment(row.time_in).format('MMM DD, YYYY HH:mm'))
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
          title: 'Duration (min)',
          render: (h, { row }) => {
            if (row.duration_minutes) {
              return h('span', row.duration_minutes.toString())
            }
            return h('span', 'In Progress')
          }
        },
        {
          title: 'Total Fee',
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
        { title: 'Processed By', key: 'processed_by' },
        { title: 'Vehicle ID', key: 'vehicle_id' },
      ],
    }
  },
  methods: {
    async fetchAllParkingRecords() {
      const { data, error } = await supabase
        .from('parking_records')
        .select('*')
        .order('record_id', { ascending: false })

      if (!error && data) {
        this.parkingRecords = data
      } else {
        console.error('Error fetching parking records:', error)
        this.$Message.error('Failed to fetch parking records')
      }
    },
  },
  mounted() {
    this.fetchAllParkingRecords()
  },
}
</script>

<style scoped>
.transaction-wrapper {
  max-width: 2000px;
  margin: auto;
  padding: 10px;
}

/* Adjust table data cell font size */
.transaction-list .ivu-table-cell {
  font-size: 12px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Status tags */
.status-active {
  color: #fa8c16;
  background-color: #fff7e6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-completed {
  color: #52c41a;
  background-color: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
