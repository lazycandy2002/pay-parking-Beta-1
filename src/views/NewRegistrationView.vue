<template>
  <div class="p-4 bg-gray-100 min-h-screen">
    <!-- Registration Form -->
    <div class="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-800">New Vehicle Registration</h2>
      <Form ref="formRef" :model="form" :rules="rules" :label-width="120">
        <FormItem label="Car ID" prop="carId">
          <Input v-model="form.carId" placeholder="Enter Car ID" />
        </FormItem>
        <FormItem label="Car Category" prop="carCategory">
          <Select v-model="form.carCategory" placeholder="Select Car Category">
            <Option v-for="category in carCategories" :key="category" :value="category">{{ category }}</Option>
          </Select>
        </FormItem>
        <FormItem label="Color" prop="color">
          <Input v-model="form.color" placeholder="Enter Car Color" />
        </FormItem>
        <FormItem label="Plate Number" prop="plateNumber">
          <Input v-model="form.plateNumber" placeholder="Enter Plate Number" />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="saveRegistration">{{ form.id ? 'Update' : 'Register' }}</Button>
          <Button @click="resetForm" style="margin-left: 8px;">Clear Form</Button>
          <Button type="success" @click="printRegistration" style="margin-left: 8px;">
            <Icon type="ios-print" /> Print Registration
          </Button>
        </FormItem>
      </Form>
    </div>

    <!-- Registration List -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4 text-blue-800">Registered Vehicles</h2>
      <Table :columns="columns" :data="vehicles" border>
        <template #action="{ row }">
          <Button size="small" type="info" @click="editRegistration(row)">Edit</Button>
          <Button size="small" type="error" @click="deleteRegistration(row.id)"
            style="margin-left: 8px;">Delete</Button>
          <Button size="small" type="success" @click="viewQRCode(row)" style="margin-left: 8px;">View QR</Button>
        </template>
      </Table>
    </div>

    <!-- QR Code Modal -->
    <Modal v-model="showQRModal" title="Registration QR Code" width="400">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <img :src="logoSrc" alt="P&PAY Logo" style="width: 120px; height: auto;">
        </div>
        <div class="text-2xl font-bold text-blue-800 mb-4">PAY PARKING</div>
        <div class="mb-4">
          <div><strong>Car ID:</strong> {{ selectedVehicle.carId }}</div>
          <div><strong>Category:</strong> {{ selectedVehicle.carCategory }}</div>
          <div><strong>Color:</strong> {{ selectedVehicle.color }}</div>
          <div><strong>Plate Number:</strong> {{ selectedVehicle.plateNumber }}</div>
        </div>
        <div class="flex justify-center">
          <div v-if="qrCodeSrc" class="mb-4">
            <img :src="qrCodeSrc" alt="QR Code">
          </div>
        </div>
      </div>
      <div slot="footer">
        <Button type="primary" @click="printQRCode">Print</Button>
        <Button @click="showQRModal = false">Close</Button>
      </div>
    </Modal>

<!-- Enhanced Hidden Print Section -->
<div id="printSection" style="display: none; font-family: 'Arial', sans-serif;">
  <div style="max-width: 700px; margin: auto; padding: 40px; border: 1px solid #ccc; background: #fff;">
    <!-- Header -->
    <div style="text-align: center; border-bottom: 2px solid #0047ab; padding-bottom: 10px; margin-bottom: 20px;">
      <img :src="logoSrc" alt="P&PAY Logo" style="width: 120px; margin-bottom: 10px;">
      <h1 style="font-size: 26px; color: #0047ab; margin: 0;">PAY PARKING REGISTRATION</h1>
      <p style="font-size: 14px; color: #666;">Automated Parking Authorization Slip</p>
    </div>

    <!-- Vehicle Details Section -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div style="width: 48%;">
        <p><strong>Car ID:</strong> 🚘 {{ selectedVehicle.carId }}</p>
        <p><strong>Category:</strong> 📂 {{ selectedVehicle.carCategory }}</p>
        <p><strong>Color:</strong> 🎨 {{ selectedVehicle.color }}</p>
      </div>
      <div style="width: 48%;">
        <p><strong>Plate Number:</strong> 🔢 {{ selectedVehicle.plateNumber }}</p>
        <p><strong>Date & Time:</strong> 🕒 {{ new Date().toLocaleString() }}</p>
        <p><strong>Status:</strong> ✅ Verified</p>
      </div>
    </div>

    <!-- QR Code -->
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; border: 2px dashed #0047ab; padding: 15px;">
        <img :src="qrCodeSrc" alt="QR Code" style="width: 200px;">
      </div>
      <p style="font-size: 14px; color: #555;">Scan this QR Code to verify registration</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #ccc; padding-top: 15px;">
      <p style="font-size: 12px; color: #999;">Printed by PAY PARKING SYSTEM | Powered by J&W</p>
    </div>
  </div>
</div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

export default {
  name: 'VehicleRegistration',
  data() {
    return {
      form: {
        id: null,
        carId: '',
        carCategory: '',
        color: '',
        plateNumber: ''
      },
      rules: {
        carId: [{ required: true, message: 'Car ID is required', trigger: 'blur' }],
        carCategory: [{ required: true, message: 'Car category is required', trigger: 'change' }],
        color: [{ required: true, message: 'Color is required', trigger: 'blur' }],
        plateNumber: [{ required: true, message: 'Plate number is required', trigger: 'blur' }]
      },
      vehicles: [],
      carCategories: ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Compact'],
      showQRModal: false,
      selectedVehicle: {},
      qrCodeSrc: '',
      logoSrc: './src/assets/J&W Logo.png', // Replace with actual path if needed
      columns: [
        { title: 'Car ID', key: 'carId' },
        { title: 'Category', key: 'carCategory' },
        { title: 'Color', key: 'color' },
        { title: 'Plate Number', key: 'plateNumber' },
        {
          title: 'Actions',
          slot: 'action',
          width: 250,
          align: 'center'
        }
      ]
    }
  },
  methods: {
    async fetchVehicles() {
      const { data, error } = await supabase.from('vehicles').select('*')
      if (!error) {
        this.vehicles = data
      } else {
        this.$Message.error('Failed to fetch vehicles')
        console.error('Error fetching vehicles:', error)
      }
    },
    async saveRegistration() {
      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          if (this.form.id) {
            // Update existing vehicle
            const { error } = await supabase
              .from('vehicles')
              .update({
                carId: this.form.carId,
                carCategory: this.form.carCategory,
                color: this.form.color,
                plateNumber: this.form.plateNumber
              })
              .eq('id', this.form.id)

            if (!error) {
              this.$Message.success('Vehicle registration updated successfully')
              this.fetchVehicles()
              this.resetForm()
            } else {
              this.$Message.error('Failed to update vehicle')
              console.error('Error updating vehicle:', error)
            }
          } else {
            // Create new vehicle
            const { error } = await supabase
              .from('vehicles')
              .insert([{
                carId: this.form.carId,
                carCategory: this.form.carCategory,
                color: this.form.color,
                plateNumber: this.form.plateNumber
              }])

            if (!error) {
              this.$Message.success('Vehicle registered successfully')
              this.fetchVehicles()
              this.resetForm()
            } else {
              this.$Message.error('Failed to register vehicle')
              console.error('Error registering vehicle:', error)
            }
          }
        }
      })
    },
    editRegistration(vehicle) {
      this.form.id = vehicle.id
      this.form.carId = vehicle.carId
      this.form.carCategory = vehicle.carCategory
      this.form.color = vehicle.color
      this.form.plateNumber = vehicle.plateNumber
    },
    async deleteRegistration(id) {
      this.$Modal.confirm({
        title: 'Confirm Delete',
        content: 'Are you sure you want to delete this registration?',
        okText: 'Yes',
        cancelText: 'No',
        onOk: async () => {
          const { error } = await supabase.from('vehicles').delete().eq('id', id)
          if (!error) {
            this.$Message.success('Vehicle registration deleted successfully')
            this.fetchVehicles()
          } else {
            this.$Message.error('Failed to delete vehicle')
            console.error('Error deleting vehicle:', error)
          }
        }
      })
    },
    resetForm() {
      this.$refs.formRef.resetFields()
      this.form.id = null
      this.form.carId = ''
      this.form.carCategory = ''
      this.form.color = ''
      this.form.plateNumber = ''
    },
    async viewQRCode(vehicle) {
      this.selectedVehicle = vehicle

      const vehicleData = JSON.stringify({
        id: vehicle.id,
        carId: vehicle.carId,
        carCategory: vehicle.carCategory,
        color: vehicle.color,
        plateNumber: vehicle.plateNumber
      })

      try {
        this.qrCodeSrc = await QRCode.toDataURL(vehicleData)
        this.showQRModal = true
      } catch (err) {
        this.$Message.error('Failed to generate QR code')
        console.error('Error generating QR code:', err)
      }
    },
    printRegistration() {
      if (!this.form.carId || !this.form.carCategory || !this.form.color || !this.form.plateNumber) {
        this.$Message.warning('Please fill all required fields before printing')
        return
      }

      // Set the current form data to selectedVehicle for printing
      this.selectedVehicle = {
        carId: this.form.carId,
        carCategory: this.form.carCategory,
        color: this.form.color,
        plateNumber: this.form.plateNumber
      }

      // Generate QR code and then print
      this.generateQRAndPrint()
    },
    async generateQRAndPrint() {
      const vehicleData = JSON.stringify({
        carId: this.selectedVehicle.carId,
        carCategory: this.selectedVehicle.carCategory,
        color: this.selectedVehicle.color,
        plateNumber: this.selectedVehicle.plateNumber
      })

      try {
        this.qrCodeSrc = await QRCode.toDataURL(vehicleData)
        setTimeout(this.printQRCode, 500) // Give time for the QR code to be generated
      } catch (err) {
        this.$Message.error('Failed to generate QR code')
        console.error('Error generating QR code:', err)
      }
    },
    printQRCode() {
      const printContent = document.getElementById('printSection').innerHTML
      const originalContent = document.body.innerHTML

      document.body.innerHTML = printContent
      window.print()
      document.body.innerHTML = originalContent

      // Reinitialize the Vue app after printing
      location.reload()
    }
  },
  mounted() {
    this.fetchVehicles()
  }
}
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }

  #printSection,
  #printSection * {
    visibility: visible;
  }

  #printSection {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>