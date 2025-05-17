<template>
  <div class="p-4">
    <Card>
      <h2>Book Inventory</h2>
      <Form :model="form" :label-width="80">
        <FormItem label="Title">
          <Input v-model="form.title" />
        </FormItem>
        <FormItem label="Author">
          <Input v-model="form.author" />
        </FormItem>
        <FormItem label="Genre">
          <Select v-model="form.genre" placeholder="Select Genre">
            <Option v-for="g in genres" :key="g" :value="g">{{ g }}</Option>
          </Select>
        </FormItem>
        <FormItem label="Price">
          <Input v-model="form.price" type="number" />
        </FormItem>
        <FormItem label="Stock">
          <Input v-model="form.quantity" type="number" />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="saveBook">{{ form.id ? 'Update' : 'Add' }}</Button>
          <Button @click="resetForm" style="margin-left: 8px;">Reset</Button>
        </FormItem>
      </Form>
    </Card>

    <Divider />

    <Table :columns="columns" :data="books" border>
      <template #action="{ row }">
        <Button size="small" type="info" @click="editBook(row)">Edit</Button>
        <Button size="small" type="error" @click="deleteBook(row.id)" style="margin-left: 8px;">Delete</Button>
      </template>
    </Table>
  </div>
</template>

<script>
import { supabase } from '@/lib/supabase'

export default {
  name: 'BookInventory',
  data() {
    return {
      form: {
        id: null,
        title: '',
        author: '',
        genre: '',
        price: null,
        quantity: null
      },
      books: [],
      genres: ['Horror', 'Comedy', 'Science', 'Romance', 'Fantasy'],
      columns: [
        { title: 'Title', key: 'title' },
        { title: 'Author', key: 'author' },
        { title: 'Genre', key: 'genre' },
        { title: 'Price', key: 'price' },
        { title: 'Stock', key: 'quantity' },
        {
          title: 'Action',
          slot: 'action',
          width: 180,
          align: 'center'
        }
      ]
    }
  },
  mounted() {
    this.fetchBooks()
  },
  methods: {
    async fetchBooks() {
      const { data, error } = await supabase.from('book').select('*')
      if (!error) this.books = data
    },
    async saveBook() {
      if (this.form.id) {
        const { error } = await supabase.from('book').update(this.form).eq('id', this.form.id)
        if (!error) {
          this.$Message.success('Book updated successfully')
          this.fetchBooks()
          this.resetForm()
        }
      } else {
        const form =  {...this.form}
        delete form.id
        const { error } = await supabase.from('book').insert([form])
        if (!error) {
          this.$Message.success('Book added successfully')
          this.fetchBooks()
          this.resetForm()
        }
      }
    },
    editBook(book) {
      console.log(book)
      this.form = { ...book }
      delete this.form._index
      delete this.form._rowKey
    },
    async deleteBook(id) {
      const { error } = await supabase.from('book').delete().eq('id', id)
      if (!error) {
        this.$Message.success('Book deleted successfully')
        this.fetchBooks()
      }
    },
    resetForm() {
      this.form = {
        id: null,
        title: '',
        author: '',
        genre: '',
        price: null,
        quantity: null
      }
    }
  }
}
</script>

<style scoped>
h2 {
  margin-bottom: 20px;
}
</style>
