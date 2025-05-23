<template>
  <div class="p-4 bg-gray-100 min-h-screen">
    <div class="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-800">Start Parking Transaction</h2>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Search Vehicle by Car ID</label>
        <div class="flex gap-3">
          <Input v-model="searchCarId" placeholder="Enter Car ID" @on-enter="searchVehicle" @on-focus="selectAllInput"
            style="width: 300px;" />
          <Button type="primary" @click="searchVehicle">Search</Button>
          <Button @click="clearSearch">Clear</Button>
        </div>
      </div>

      <div v-if="selectedVehicle" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 class="text-lg font-semibold text-green-800 mb-3">Vehicle Found ✓</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Car ID:</strong> {{ selectedVehicle.carId }}</div>
          <div><strong>Category:</strong> {{ selectedVehicle.carCategory }}</div>
          <div><strong>Color:</strong> {{ selectedVehicle.color }}</div>
          <div><strong>Plate Number:</strong> {{ selectedVehicle.plateNumber }}</div>
        </div>
      </div>

      <div v-if="showNotFoundMessage" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 class="text-lg font-semibold text-red-800 mb-2">Vehicle Not Found ✗</h3>
        <p class="text-red-600">Please register this vehicle first before proceeding with parking.</p>
        <Button type="error" @click="redirectToRegistration" class="mt-2">Go to Registration</Button>
      </div>
    </div>

    <div v-if="selectedVehicle" class="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4 text-blue-800">Select Parking Slot</h2>

      <div class="mb-4">
        <Button type="success" @click="fetchVacantSlots">Refresh Available Slots</Button>
      </div>

      <div v-if="vacantSlots.length > 0" class="grid grid-cols-4 gap-3">
        <div v-for="slot in vacantSlots" :key="slot.slot_id"
          class="p-3 border-2 rounded-lg cursor-pointer transition-all"
          :class="selectedSlot?.slot_id === slot.slot_id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'"
          @click="selectSlot(slot)">
          <div class="text-center">
            <div class="text-lg font-bold">{{ slot.slot_label }}</div>
            <div class="text-sm text-gray-600">{{ slot.status }}</div>
            <div class="text-xs text-green-600">Available</div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <p>No vacant parking slots available at the moment.</p>
        <Button @click="fetchVacantSlots" class="mt-2">Check Again</Button>
      </div>

      <div v-if="selectedSlot" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 class="text-lg font-semibold text-blue-800 mb-2">Selected Slot</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Slot Label:</strong> {{ selectedSlot.slot_label }}</div>
          <div><strong>Status:</strong> {{ selectedSlot.status }}</div>
        </div>
      </div>
    </div>

    <div v-if="selectedVehicle && selectedSlot" class="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4 text-blue-800">Transaction Summary</h2>

      <div class="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h4 class="font-semibold mb-2">Vehicle Details</h4>
          <p><strong>Car ID:</strong> {{ selectedVehicle.carId }}</p>
          <p><strong>Plate:</strong> {{ selectedVehicle.plateNumber }}</p>
          <p><strong>Color:</strong> {{ selectedVehicle.color }}</p>
        </div>
        <div>
          <h4 class="font-semibold mb-2">Parking Details</h4>
          <p><strong>Slot:</strong> {{ selectedSlot.slot_label }}</p>
          <p><strong>Status:</strong> {{ selectedSlot.status }}</p>
        </div>
      </div>

      <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p><strong>Entry Time:</strong> {{ new Date().toLocaleString() }}</p>
      </div>

      <div class="flex gap-3">
        <Button type="primary" size="large" :loading="isProcessing" @click="confirmTransaction">
          {{ isProcessing ? 'Processing...' : 'Confirm Parking Entry' }}
        </Button>
        <Button @click="resetTransaction" size="large">Reset</Button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4 text-blue-800">Active Parking Sessions</h2>

      <div class="mb-4">
        <Button type="success" @click="fetchActiveTransactions">Refresh</Button>
      </div>

      <Table :columns="transactionColumns" :data="activeTransactions" border>
        <template #actions="{ row }">
          <Button size="small" type="warning" @click="processCheckout(row)">Check Out</Button>
          <Button size="small" type="info" @click="viewDetails(row)" style="margin-left: 8px;">Details</Button>
        </template>
      </Table>
    </div>

    <Modal v-model="showCheckoutModal" title="Process Checkout" width="500">
      <div v-if="checkoutTransaction">
        <div class="mb-4">
          <h4 class="font-semibold mb-2">Vehicle Information</h4>
          <p><strong>Car ID:</strong> {{ checkoutTransaction.vehicle?.carId }}</p>
          <p><strong>Plate Number:</strong> {{ checkoutTransaction.vehicle?.plateNumber }}</p>
          <p><strong>Slot:</strong> {{ checkoutTransaction.parking_slot?.slot_label }}</p>
        </div>

        <div class="mb-4">
          <h4 class="font-semibold mb-2">Parking Duration</h4>
          <p><strong>Time In:</strong> {{ checkoutTransaction.time_in }}</p>
          <p><strong>Time Out:</strong> {{ new Date().toLocaleString() }}</p>
          <p><strong>Duration:</strong> {{ calculateDuration(checkoutTransaction.time_in) }} minutes</p>
        </div>

        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 class="font-semibold text-green-800">Total Fee: ₱{{ calculateFee(checkoutTransaction) }}</h4>
          <p class="text-sm text-gray-600 mt-1">Rate: ₱50/hour (Standard Rate)</p>
        </div>
      </div>

      <div slot="footer">
        <Button type="primary" @click="confirmCheckout" :loading="isProcessing">Confirm Checkout</Button>
        <Button @click="showCheckoutModal = false">Cancel</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'

export default {
  name: 'ParkingTransaction',
  data() {
    return {
      searchCarId: '',
      selectedVehicle: null,
      showNotFoundMessage: false,
      vacantSlots: [],
      selectedSlot: null,
      isProcessing: false,
      activeTransactions: [],
      showCheckoutModal: false,
      checkoutTransaction: null,
      transactionColumns: [
        { title: 'Record ID', key: 'record_id', width: 100 },
        {
          title: 'Car ID',
          key: 'carId',
          render: (h, params) => {
            return h('span', params.row.vehicle?.carId || 'N/A')
          }
        },
        {
          title: 'Plate Number',
          key: 'plateNumber',
          render: (h, params) => {
            return h('span', params.row.vehicle?.plateNumber || 'N/A')
          }
        },
        {
          title: 'Slot',
          key: 'slot',
          render: (h, params) => {
            return h('span', params.row.parking_slot?.slot_label || 'N/A')
          }
        },
        {
          title: 'Time In',
          key: 'time_in',
          render: (h, params) => {
            return h('span', params.row.time_in || 'N/A'); // Show the stored string as is
          }
        },
        { title: 'Status', key: 'status' },
        {
          title: 'Actions',
          slot: 'actions',
          width: 180,
          align: 'center'
        }
      ]
    }
  },
  watch: {
    searchCarId(newValue) {
      if (newValue.length === 4) {
        this.searchVehicle();
      }
    }
  },
  methods: {
    selectAllInput(event) {
      if (event.target) {
        event.target.select();
      }
    },

    async searchVehicle() {
      if (!this.searchCarId.trim()) {
        this.$Message.warning('Please enter a Car ID');
        return;
      }

      if (this.searchCarId.trim().length !== 4) {
        this.$Message.warning('Car ID must be exactly 4 digits');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('carId', this.searchCarId.trim())
          .single();

        if (error || !data) {
          this.selectedVehicle = null;
          this.showNotFoundMessage = true;
          this.$Message.error('Vehicle not found');
        } else {
          this.selectedVehicle = data;
          this.showNotFoundMessage = false;
          this.$Message.success('Vehicle found!');
          await this.fetchVacantSlots();
        }
      } catch (error) {
        console.error('Error searching vehicle:', error);
        this.$Message.error('Error searching vehicle');
      }
    },

    async fetchVacantSlots() {
      try {
        const { data, error } = await supabase
          .from('parking_slots')
          .select('*')
          .eq('status', 'vacant')
          .order('slot_label');

        if (!error) {
          this.vacantSlots = data || [];
          if (this.vacantSlots.length === 0) {
            this.$Message.warning('No vacant parking slots available');
          }
        } else {
          console.error('Error fetching vacant slots:', error);
          this.$Message.error('Failed to fetch parking slots');
        }
      } catch (error) {
        console.error('Error fetching vacant slots:', error);
      }
    },

    selectSlot(slot) {
      this.selectedSlot = slot;
    },

    async confirmTransaction() {
      if (!this.selectedVehicle || !this.selectedSlot) {
        this.$Message.warning('Please select both vehicle and parking slot');
        return;
      }

      this.isProcessing = true;

      try {
        const timeIn = new Date().toLocaleString(); // format local datetime string

        // Insert new parking record directly
        const { data: insertData, error: insertError } = await supabase
          .from('parking_records')
          .insert([{
            slot_id: this.selectedSlot.slot_id,
            time_in: timeIn,
            status: 'active',
            vehicle_id: this.selectedVehicle.id
          }]);

        if (insertError) {
          throw insertError;
        }

        // Update parking slot to occupied
        const { error: slotError } = await supabase
          .from('parking_slots')
          .update({
            status: 'occupied',
            occupied_by: this.selectedVehicle.id
          })
          .eq('slot_id', this.selectedSlot.slot_id);

        if (slotError) {
          throw slotError;
        }

        this.$Message.success('Parking transaction started successfully!');
        await this.fetchActiveTransactions();
        this.resetTransaction();

      } catch (error) {
        console.error('Error creating transaction:', error);
        this.$Message.error('Failed to start parking transaction');
      } finally {
        this.isProcessing = false;
      }
    },


    async fetchActiveTransactions() {
      try {
        const { data, error } = await supabase
          .from('parking_records')
          .select(`
            *,
            vehicle:vehicles(*),
            parking_slot:parking_slots(*)
          `)
          .eq('status', 'active')
          .order('time_in', { ascending: false });

        if (!error) {
          this.activeTransactions = data || [];
        } else {
          console.error('Error fetching active transactions:', error);
        }
      } catch (error) {
        console.error('Error fetching active transactions:', error);
      }
    },

    processCheckout(transaction) {
      this.checkoutTransaction = transaction;
      this.showCheckoutModal = true;
    },

    calculateDuration(timeInStr, timeOutStr = new Date().toLocaleString()) {
      // Parse the time strings to Date objects
      const timeIn = new Date(timeInStr);
      const timeOut = new Date(timeOutStr);

      if (isNaN(timeIn.getTime()) || isNaN(timeOut.getTime())) {
        return 0;
      }

      // Ensure timeOut is always after timeIn
      if (timeOut < timeIn) {
        return 0; // or handle this case as needed
      }

      const diffMs = timeOut - timeIn;
      const diffMins = Math.ceil(diffMs / (1000 * 60));
      return diffMins > 0 ? diffMins : 0;
    },

    calculateFee(transaction) {
      const duration = this.calculateDuration(transaction.time_in, transaction.time_out);
      const hours = Math.ceil(duration / 60);
      const rate = 50; // Standard rate
      return hours * rate;
    },


    printReceipt(transaction) {
      const receiptContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="text-align: center;">Parking Receipt</h2>
          <p><strong>Record ID:</strong> ${transaction.record_id}</p>
          <p><strong>Car ID:</strong> ${transaction.vehicle?.carId}</p>
          <p><strong>Plate Number:</strong> ${transaction.vehicle?.plateNumber}</p>
          <p><strong>Slot:</strong> ${transaction.parking_slot?.slot_label}</p>
          <p><strong>Time In:</strong> ${transaction.time_in}</p>
          <p><strong>Time Out:</strong> ${transaction.time_out || new Date().toLocaleString()}</p>
          <p><strong>Duration:</strong> ${this.calculateDuration(transaction.time_in, transaction.time_out || new Date().toLocaleString())} minutes</p>
          <p><strong>Total Fee:</strong> ₱${this.calculateFee(transaction)}</p>
          <p style="text-align:center; margin-top: 20px;">Thank you for parking with us!</p>
        </div>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              h2 { text-align: center; }
              p { margin: 5px 0; }
            </style>
          </head>
          <body>
            ${receiptContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      // Optionally close window after printing (user experience may vary)
      // printWindow.close();
    },

    async confirmCheckout() {
      if (!this.checkoutTransaction) return;

      this.isProcessing = true;

      try {
        const timeOut = new Date().toLocaleString(); // store as string

        // Calculate duration using stored time_in string and now
        const duration = this.calculateDuration(this.checkoutTransaction.time_in, timeOut);
        const totalFee = this.calculateFee({ ...this.checkoutTransaction, time_out: timeOut });

        const { error: recordError } = await supabase
          .from('parking_records')
          .update({
            time_out: timeOut,
            duration_minutes: duration,
            total_fee: totalFee,
            status: 'completed'
          })
          .eq('record_id', this.checkoutTransaction.record_id);

        if (recordError) throw recordError;

        const { error: slotError } = await supabase
          .from('parking_slots')
          .update({
            status: 'vacant',
            occupied_by: null
          })
          .eq('slot_id', this.checkoutTransaction.slot_id);

        if (slotError) throw slotError;

        this.$Message.success(`Checkout completed! Total fee: ₱${totalFee}`);
        
        // Print the receipt
        this.printReceipt({ ...this.checkoutTransaction, time_out: timeOut });

        this.showCheckoutModal = false;
        this.checkoutTransaction = null;
        await this.fetchActiveTransactions();
        await this.fetchVacantSlots();

      } catch (error) {
        console.error('Error processing checkout:', error);
        this.$Message.error('Failed to process checkout');
      } finally {
        this.isProcessing = false;
      }
    },

    viewDetails(transaction) {
      this.$Modal.info({
        title: 'Transaction Details',
        content: `
          <div>
            <p><strong>Record ID:</strong> ${transaction.record_id}</p>
            <p><strong>Car ID:</strong> ${transaction.vehicle?.carId}</p>
            <p><strong>Plate Number:</strong> ${transaction.vehicle?.plateNumber}</p>
            <p><strong>Slot:</strong> ${transaction.parking_slot?.slot_label}</p>
            <p><strong>Time In:</strong> ${transaction.time_in}</p>
            <p><strong>Time Out:</strong> ${transaction.time_out || 'N/A'}</p>
            <p><strong>Duration:</strong> ${this.calculateDuration(transaction.time_in, transaction.time_out || new Date().toLocaleString())
          } minutes</p>
            <p><strong>Current Fee:</strong> ₱${this.calculateFee(transaction)}</p>
          </div>
        `,
        width: 500
      });
    },

    clearSearch() {
      this.searchCarId = '';
      this.selectedVehicle = null;
      this.showNotFoundMessage = false;
      this.resetTransaction();
    },

    resetTransaction() {
      this.selectedSlot = null;
      this.vacantSlots = [];
      this.fetchVacantSlots();
    },

    redirectToRegistration() {
      this.$Message.info('Navigate to vehicle registration page');
      // Example of actual navigation if using Vue Router:
      // this.$router.push('/registration');
    }
  },

  async mounted() {
    await this.fetchActiveTransactions();
  }
}
</script>

<style scoped>
.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.gap-3 {
  gap: 0.75rem;
}

.gap-4 {
  gap: 1rem;
}

.gap-6 {
  gap: 1.5rem;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
