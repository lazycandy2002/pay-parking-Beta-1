<template>
  <div class="transaction-wrapper">
    <Card title="Book Sale Transaction" class="transaction-form">
      <Form ref="formRef" :model="form" :rules="rules" label-width="120">
        <FormItem>
          <Input v-model="search" placeholder="Search book..." @input="filterBooks" />
          <Table :columns="bookColumns" :data="filteredBooks" @on-row-click="selectBook" size="small" border
            height="200" :row-class-name="rowClassName" />
        </FormItem>
        <FormItem label="Book" prop="bookId">
          <!--  <Input v-model="search" placeholder="Search book..." @input="filterBooks" />
          <Table
            :columns="bookColumns"
            :data="filteredBooks"
            @on-row-click="selectBook"
            size="small"
            border
            height="200"
            :row-class-name="rowClassName"
          /> -->
          <div v-if="form.bookId">
            <p>{{ selectedBook.title }}</p>
            <p>Available Quantity: {{ selectedBook.quantity }}</p>
          </div>
        </FormItem>

        <FormItem label="Customer Name" prop="customerName">
          <Input v-model="form.customerName" placeholder="Enter customer name" />
        </FormItem>

        <FormItem label="Note">
          <Input v-model="form.note" type="textarea" placeholder="Optional note" />
        </FormItem>

        <FormItem label="Quantity" prop="quantity">
          <InputNumber v-model="form.quantity" :min="1" :max="selectedBook.quantity" :disabled="!form.bookId" />
        </FormItem>

        <FormItem label="Price">
          <span> {{ form.price }}</span>
        </FormItem>

        <FormItem label="Total">
          <b> ₱ {{ form.price * form.quantity }}</b>
        </FormItem>

        <FormItem>
          <Button type="primary" @click="submit">Submit</Button>
        </FormItem>
      </Form>
    </Card>

    <Card title="Transaction History" class="transaction-list">
      <Table :columns="transactionColumns" :data="transactions" border />
    </Card>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'

export default {
  name: 'BookTransaction',
  data() {
    return {
      form: {
        bookId: null,
        customerName: '',
        note: '',
        quantity: 1,
        price: 0,
      },
      rules: {
        bookId: [{ required: true, message: 'Please select a book' }],
        customerName: [{ required: true, message: 'Customer name is required', trigger: 'blur' }],
        quantity: [
          { required: true, type: 'number', min: 1, message: 'Minimum quantity is 1', trigger: 'change' },
          {
            validator: (rule, value, callback) => {
              if (value > this.selectedBook.quantity) {
                callback(new Error('Quantity exceeds available quantity'))
              } else {
                callback()
              }
            },
            trigger: 'change',
          },
        ],
        price: [{ required: true }],
      },
      books: [],
      filteredBooks: [],
      selectedBook: {},
      search: '',
      transactions: [],
      bookColumns: [
        { title: 'Title', key: 'title' },
        { title: 'Author', key: 'author' },
        { title: 'Price', key: 'price' },
        { title: 'Available Quantity', key: 'quantity' },
      ],
      transactionColumns: [
        { title: 'Customer', key: 'customerName' },
        { title: 'Book', key: 'title' },
        { title: 'Note', key: 'note' },
        { title: 'Quantity', key: 'quantity' },
        { title: 'Price', key: 'price' },
        {
          title: 'Total',
          render: (h, { row }) => h('span', row.quantity * row.price),
        },
      ],
    }
  },
  methods: {
    async fetchBooks() {
      const { data, error } = await supabase.from('book').select('*').gte('quantity', 1)
      if (!error) {
        this.books = data
        this.filteredBooks = data
      } else {
        this.$Message.error('Failed to fetch books')
      }
    },
    async fetchTransactions() {
      const { data, error } = await supabase
        .from('transaction')
        .select(`*, book(title)`)
        .order('id', { ascending: false })
        .limit(20)

      if (!error) {
        this.transactions = data.map(txn => ({
          ...txn,
          title: txn.book?.title || '',
        }));
      }
    },
    filterBooks() {
      const keyword = this.search.toLowerCase()
      this.filteredBooks = this.books.filter(
        book => book.title.toLowerCase().includes(keyword)
      )
    },
    selectBook(row) {
      if (row.quantity <= 0) {
        this.$Message.warning('This book is out of quantity')
        return
      }
      this.form.bookId = row.id
      this.form.price = row.price
      this.form.quantity = 1
      this.selectedBook = row
    },
    rowClassName(row) {
      return row.quantity <= 0 ? 'row-disabled' : ''
    },
    async submit() {
      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          if (this.form.quantity > this.selectedBook.quantity) {
            this.$Message.error('Not enough quantity for this book')
            return
          }

          const { error: insertError } = await supabase.from('transaction').insert([{
            bookId: this.form.bookId,
            customerName: this.form.customerName,
            note: this.form.note,
            quantity: this.form.quantity,
            price: this.form.price,
          }])

          if (insertError) {
            this.$Message.error('Failed to save transaction')
            return
          }

          // update book quantity
          const newQty = this.selectedBook.quantity - this.form.quantity
          const { error: updateError } = await supabase
            .from('book')
            .update({ quantity: newQty })
            .eq('id', this.form.bookId)

          if (updateError) {
            this.$Message.error('Saved transaction, but failed to update book quantity')
          }

          this.$Message.success('Transaction completed!')
          this.resetForm()
          this.fetchBooks()
          this.fetchTransactions()
        }
      })
    },
    resetForm() {
      this.form = {
        bookId: null,
        customerName: '',
        note: '',
        quantity: 1,
        price: 0,
      }
      this.selectedBook = {}
      this.search = ''
    },
  },
  mounted() {
    this.fetchBooks()
    this.fetchTransactions()
  },
}
</script>

<style scoped>
.transaction-wrapper {
  max-width: 900px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.transaction-form {
  padding: 20px;
}

.row-disabled {
  background-color: #f5f5f5;
  color: #aaa;
  pointer-events: none;
}
</style>
