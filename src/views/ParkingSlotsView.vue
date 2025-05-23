<template>
  <div class="p-4 bg-gray-100 min-h-screen">
    <div class="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-800">Parking Slot Registration</h2>
      <Form ref="formRef" :model="form" :rules="rules" :label-width="120" class="responsive-form">
        <FormItem label="Slot ID" prop="slot_id">
          <Input v-model="form.slot_id" placeholder="Auto Generated" readonly />
        </FormItem>
        <FormItem label="Slot Label" prop="slot_label">
          <Input v-model="form.slot_label" placeholder="Enter Slot Label" />
        </FormItem>
        <FormItem label="Status" prop="status">
          <Select v-model="form.status" placeholder="Select Status">
            <Option value="vacant">Vacant</Option>
            <Option value="occupied">Occupied</Option>
          </Select>
        </FormItem>
        <FormItem label="Occupied By" prop="occupied_by">
          <Input v-model="form.occupied_by" placeholder="Enter Occupant Name" />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="saveRegistration">{{ form.id ? 'Update' : 'Register' }}</Button>
          <Button @click="resetForm" style="margin-left: 8px;">Clear Form</Button>
        </FormItem>
      </Form>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4 text-blue-800">Registered Parking Slots</h2>
      <div class="mb-4">
        <Input v-model="searchQuery" placeholder="Search by Slot Label or Occupant" clearable class="w-full md:w-1/2 lg:w-1/3" />
      </div>
      <div class="table-container">
        <Table :columns="columns" :data="filteredParkingSlots" border>
          <template #action="{ row }">
            <Button size="small" type="info" @click="editRegistration(row)">Edit</Button>
            <Button size="small" type="error" @click="deleteRegistration(row.slot_id)" style="margin-left: 8px;">Delete</Button>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'

export default {
  name: 'ParkingSlotRegistration',
  data() {
    return {
      form: {
        id: null,
        slot_id: '',
        slot_label: '',
        status: '',
        occupied_by: ''
      },
      rules: {
        slot_label: [{ required: true, message: 'Slot label is required', trigger: 'blur' }],
        status: [{ required: true, message: 'Status is required', trigger: 'change' }],
        occupied_by: [{ required: false, message: 'Occupied by is optional', trigger: 'blur' }]
      },
      parkingSlots: [],
      searchQuery: '',
      columns: [
        { title: 'Slot ID', key: 'slot_id', width: 100 }, // Added width for better control
        { title: 'Slot Label', key: 'slot_label', minWidth: 150 }, // minWidth for flexibility
        { title: 'Status', key: 'status', width: 120 },
        { title: 'Occupied By', key: 'occupied_by', minWidth: 150 },
        {
          title: 'Actions',
          slot: 'action',
          width: 160, // Adjusted width
          align: 'center'
        }
      ]
    }
  },
  computed: {
    filteredParkingSlots() {
      if (!this.searchQuery) {
        return this.parkingSlots;
      }
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      return this.parkingSlots.filter(slot => {
        return (
          slot.slot_label.toLowerCase().includes(lowerCaseQuery) ||
          (slot.occupied_by && slot.occupied_by.toLowerCase().includes(lowerCaseQuery)) ||
          slot.slot_id.toString().includes(lowerCaseQuery)
        );
      });
    }
  },
  methods: {
    async fetchParkingSlots() {
      const { data, error } = await supabase.from('parking_slots').select('*')
      if (!error) {
        this.parkingSlots = data
      } else {
        this.$Message.error('Failed to fetch parking slots')
        console.error('Error fetching parking slots:', error)
      }
    },
    async generateNextSlotId() {
      try {
        const { data, error } = await supabase.from('parking_slots').select('slot_id')

        if (error) {
          console.error('Error fetching slot IDs:', error)
          return 1
        }

        if (!data || data.length === 0) {
          return 1
        }

        const maxSlotId = Math.max(...data.map(slot => slot.slot_id))
        return maxSlotId + 1
      } catch (error) {
        console.error('Error generating next slot ID:', error)
        return 1
      }
    },
    async saveRegistration() {
      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          if (this.form.id) {
            const { error } = await supabase
              .from('parking_slots')
              .update({
                slot_label: this.form.slot_label,
                status: this.form.status,
                occupied_by: this.form.occupied_by
              })
              .eq('slot_id', this.form.id)

            if (!error) {
              this.$Message.success('Parking slot updated successfully')
              this.fetchParkingSlots()
              this.resetForm()
            } else {
              this.$Message.error('Failed to update parking slot')
              console.error('Error updating parking slot:', error)
            }
          } else {
            const { error } = await supabase
              .from('parking_slots')
              .insert([{
                slot_id: this.form.slot_id,
                slot_label: this.form.slot_label,
                status: this.form.status,
                occupied_by: this.form.occupied_by
              }])

            if (!error) {
              this.$Message.success('Parking slot registered successfully')
              this.fetchParkingSlots()
              this.resetForm()
            } else {
              this.$Message.error('Failed to register parking slot')
              console.error('Error registering parking slot:', error)
            }
          }
        }
      })
    },
    editRegistration(slot) {
      this.form.id = slot.slot_id
      this.form.slot_id = slot.slot_id
      this.form.slot_label = slot.slot_label
      this.form.status = slot.status
      this.form.occupied_by = slot.occupied_by
    },
    async deleteRegistration(id) {
      this.$Modal.confirm({
        title: 'Confirm Delete',
        content: 'Are you sure you want to delete this parking slot?',
        okText: 'Yes',
        cancelText: 'No',
        onOk: async () => {
          const { error } = await supabase.from('parking_slots').delete().eq('slot_id', id)
          if (!error) {
            this.$Message.success('Parking slot deleted successfully')
            this.fetchParkingSlots()
          } else {
            this.$Message.error('Failed to delete parking slot')
            console.error('Error deleting parking slot:', error)
          }
        }
      })
    },
    async resetForm() {
      this.$refs.formRef.resetFields()
      this.form.id = null
      this.form.slot_label = ''
      this.form.status = ''
      this.form.occupied_by = ''

      this.form.slot_id = await this.generateNextSlotId()
    }
  },
  async mounted() {
    await this.fetchParkingSlots()
    this.form.slot_id = await this.generateNextSlotId()
  }
}
</script>

<style scoped>
.responsive-form .ivu-form-item {
  margin-bottom: 16px; /* Adjust as needed for tighter spacing */
}

/* Make the form labels align better on smaller screens */
@media (max-width: 768px) {
  .responsive-form .ivu-form-item-label {
    text-align: left;
    width: 100% !important;
    padding-right: 0;
  }
  .responsive-form .ivu-form-item-content {
    margin-left: 0 !important;
  }
}

/* Container for table to manage overflow */
.table-container {
  overflow-x: auto; /* Allows horizontal scrolling for the table if content is too wide */
  max-height: 400px;
  overflow-y: auto;
}

/* Adjust search input width for different screen sizes using Tailwind classes */
.w-full {
  width: 100%;
}

.md\:w-1\/2 {
  width: 50%;
}

.lg\:w-1\/3 {
  width: 33.333333%;
}
</style>