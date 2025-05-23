<template>
  <div class="p-4 bg-gray-100 min-h-screen">
    <div class="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-800">Fee Setting (ID: {{ form.feeId }})</h2>
      <Form ref="formRef" :model="form" :rules="rules" :label-width="190" class="responsive-form">
        <FormItem label="Fee ID">
          <Input v-model="form.feeId" placeholder="Auto Generated" readonly />
        </FormItem>
        <FormItem label="Fee Amount Per Hour (₱)" prop="fee">
          <Input
            v-model="form.fee"
            placeholder="Enter fee amount in Pesos"
            style="width: 100%"
          />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="saveFeeSettings">Update Fee Setting</Button>
          <Button type="success" @click="printFeeSettings" style="margin-left: 8px;">
            <Icon type="ios-print" /> Print Fee Schedule
          </Button>
        </FormItem>
      </Form>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4 text-blue-800">Current Fee Details</h2>
      <div class="mb-4">
        <Tag color="blue">Fee ID: {{ feeSettings.length > 0 ? feeSettings[0].fee_id : 'N/A' }}</Tag>
        <Tag color="green" v-if="feeSettings.length > 0">
          Fee Amount: ₱{{ formatFeeDisplay(feeSettings[0].fee) }}
        </Tag>
        <Tag color="orange" v-if="feeSettings.length === 0">
          No Fee Set
        </Tag>
      </div>
      <div class="mb-4">
        <Input v-model="searchQuery" placeholder="Search Fee Settings (e.g., by ID)" clearable class="w-full md:w-1/2 lg:w-1/3" />
      </div>
      <div class="table-container">
        <Table :columns="columns" :data="filteredFeeSettings" border>
          <template #feeDisplay="{ row }">
            <span style="color: #2d8cf0; font-weight: bold;">₱{{ formatFeeDisplay(row.fee) }}</span>
          </template>
        </Table>
      </div>
    </div>

    <div id="printSection" style="display: none; font-family: 'Arial', sans-serif;">
      <div style="max-width: 800px; margin: auto; padding: 40px; border: 1px solid #ccc; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #0047ab; padding-bottom: 15px; margin-bottom: 25px;">
          <img :src="logoSrc" alt="P&PAY Logo" style="width: 120px; margin-bottom: 10px;">
          <h1 style="font-size: 28px; color: #0047ab; margin: 0;">PAY PARKING FEE SCHEDULE</h1>
          <p style="font-size: 16px; color: #666;">Official Parking Rate Structure (Philippine Pesos)</p>
          <p style="font-size: 14px; color: #999;">Generated on {{ new Date().toLocaleDateString() }}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #0047ab; margin-bottom: 15px;">📋 Current Hourly Parking Fee</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa; border-bottom: 2px solid #0047ab;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Description</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Fee Amount Per Hour (₱)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="feeSettings.length > 0" style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd;">Standard Hourly Rate</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #2d8cf0;">
                  ₱{{ formatFeeDisplay(feeSettings[0].fee) }}
                </td>
              </tr>
              <tr v-else>
                <td colspan="2" style="padding: 10px; text-align: center; color: #666;">No fee setting available.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <div>
            <p><strong>💰 Current Hourly Fee:</strong> ₱{{ feeSettings.length > 0 ? formatFeeDisplay(feeSettings[0].fee) : 'N/A' }}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>⏰ Generated At:</strong> {{ new Date().toLocaleString() }}</p>
            <p><strong>📋 Status:</strong> ✅ Active</p>
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #ccc; padding-top: 15px;">
          <p style="font-size: 12px; color: #999;">Official PAY PARKING System Fee Schedule | Powered by J&W</p>
          <p style="font-size: 10px; color: #ccc;">This document is computer generated and does not require signature</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'

export default {
  name: 'FeeSettings',
  data() {
    return {
      form: {
        id: 1,
        feeId: 1,
        fee: '' // Changed to empty string for text input
      },
      rules: {
        fee: [
          { required: true, message: 'Fee amount is required', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value === null || value.trim() === '') {
                callback(new Error('Fee amount cannot be empty'));
              } else if (!/^\d+(\.\d{1,2})?$/.test(value)) {
                callback(new Error('Fee amount must be a valid number (e.g., 10 or 10.50)'));
              } else if (parseFloat(value) < 0) {
                callback(new Error('Fee amount must be positive'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ]
      },
      feeSettings: [],
      searchQuery: '',
      logoSrc: './src/assets/J&W Logo.png',
      columns: [
        { title: 'Fee ID', key: 'fee_id', width: 100 },
        {
          title: 'Fee Amount (₱)',
          slot: 'feeDisplay',
          width: 140,
          align: 'right'
        }
      ]
    }
  },
  computed: {
    minFee() {
      if (this.feeSettings.length === 0 || isNaN(parseFloat(this.feeSettings[0].fee))) return 0
      return parseFloat(this.feeSettings[0].fee)
    },
    maxFee() {
      if (this.feeSettings.length === 0 || isNaN(parseFloat(this.feeSettings[0].fee))) return 0
      return parseFloat(this.feeSettings[0].fee)
    },
    filteredFeeSettings() {
      if (!this.searchQuery) {
        return this.feeSettings;
      }
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      return this.feeSettings.filter(feeItem => {
        return feeItem.fee_id.toString().includes(lowerCaseQuery) ||
               this.formatFeeDisplay(feeItem.fee).toLowerCase().includes(lowerCaseQuery);
      });
    }
  },
  methods: {
    async fetchFeeSettings() {
      const { data, error } = await supabase.from('fee_settings').select('fee_id, fee').eq('fee_id', 1).limit(1)

      if (!error && data && data.length > 0) {
        this.feeSettings = data;
        this.form.fee = data[0].fee; // Assign string value directly
      } else {
        this.$Message.warning('No fee setting found for ID 1. Initializing with default fee of 0.');
        console.warn('No fee setting found or error fetching:', error);
        this.feeSettings = [];
        this.form.fee = '0.00'; // Default to '0.00' as a string
      }
    },
    async saveFeeSettings() {
      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          const { error } = await supabase
            .from('fee_settings')
            .update({
              fee: this.form.fee // Sending as string
            })
            .eq('fee_id', 1);

          if (!error) {
            this.$Message.success('Fee setting for ID 1 updated successfully');
            this.fetchFeeSettings();
          } else {
            this.$Message.error('Failed to update fee setting for ID 1');
            console.error('Error updating fee setting:', error);
          }
        }
      });
    },
    formatFeeDisplay(fee) {
      if (fee === null || typeof fee === 'undefined' || fee.trim() === '') {
        return 'N/A';
      }
      // Attempt to convert to a number for consistent formatting, then back to string
      const numericFee = parseFloat(fee);
      if (isNaN(numericFee)) {
        return fee; // Return as is if it's not a valid number
      }
      return numericFee.toFixed(2).replace(/\.00$/, ''); // Format and remove trailing .00
    },
    printFeeSettings() {
      if (this.feeSettings.length === 0) {
        this.$Message.warning('No fee settings available to print');
        return;
      }

      setTimeout(() => {
        const printContent = document.getElementById('printSection').innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;

        location.reload();
      }, 100);
    }
  },
  async mounted() {
    await this.fetchFeeSettings();
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

/* Added responsive form and table container styles from ParkingSlotRegistration */
.responsive-form .ivu-form-item {
  margin-bottom: 16px;
}

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

.table-container {
  overflow-x: auto;
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
}

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