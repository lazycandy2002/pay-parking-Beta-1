<template>
  <div class="inventory-crud">
    <Card shadow>
      <template #title>
        Inventory Management
        <Button type="primary" size="small" icon="md-add" @click="openForm()">Add Item</Button>
      </template>

      <Table :columns="columns" :data="inventory" stripe border />

      <Modal
        v-model="modalVisible"
        :title="isEditing ? 'Edit Item' : 'Add Item'"
        @on-ok="submitForm"
        :loading="formSubmitting"
        ok-text="Save"
      >
        <Form ref="formRef" :model="formData" :rules="rules" label-position="top">
          <FormItem label="Name" prop="name">
            <Input v-model="formData.name" placeholder="Item name" />
          </FormItem>
          <FormItem label="Category" prop="category">
            <Input v-model="formData.category" placeholder="Category" />
          </FormItem>
          <FormItem label="Quantity" prop="quantity">
            <InputNumber v-model="formData.quantity" :min="0" style="width: 100%" />
          </FormItem>
        </Form>
      </Modal>
    </Card>
  </div>
</template>

<script>
export default {
  name: 'InventoryCrud',
  data() {
    return {
      inventory: [],
      modalVisible: false,
      isEditing: false,
      editingIndex: null,
      formSubmitting: false,
      formData: {
        name: '',
        category: '',
        quantity: 0,
      },
      rules: {
        name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
        category: [{ required: true, message: 'Category is required', trigger: 'blur' }],
        quantity: [{ type: 'number', required: true, message: 'Quantity required', trigger: 'change' }],
      },
      columns: [
        { title: 'Name', key: 'name' },
        { title: 'Category', key: 'category' },
        { title: 'Quantity', key: 'quantity' },
        {
          title: 'Actions',
          key: 'actions',
          render: (h, { index }) => {
            return h('div', [
              h(
                'Button',
                {
                  props: { size: 'small', type: 'primary' },
                  style: { marginRight: '8px' },
                  on: { click: () => this.openForm(this.inventory[index], index) },
                },
                'Edit'
              ),
              h(
                'Button',
                {
                  props: { size: 'small', type: 'error' },
                  on: { click: () => this.deleteItem(index) },
                },
                'Delete'
              ),
            ]);
          },
        },
      ],
    };
  },
  methods: {
    openForm(item = null, index = null) {
      this.isEditing = !!item;
      this.editingIndex = index;
      this.modalVisible = true;

      this.formData = item
        ? { ...item }
        : { name: '', category: '', quantity: 0 };
    },
    submitForm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.formSubmitting = true;

          setTimeout(() => {
            if (this.isEditing && this.editingIndex !== null) {
              this.inventory.splice(this.editingIndex, 1, { ...this.formData });
              this.$Message.success('Item updated!');
            } else {
              this.inventory.push({ ...this.formData });
              this.$Message.success('Item added!');
            }

            this.formSubmitting = false;
            this.modalVisible = false;
          }, 500);
        }
      });
    },
    deleteItem(index) {
      this.$Modal.confirm({
        title: 'Confirm Delete',
        content: 'Are you sure you want to delete this item?',
        onOk: () => {
          this.inventory.splice(index, 1);
          this.$Message.success('Item deleted');
        },
      });
    },
  },
};
</script>

<style scoped>
.inventory-crud {
  padding: 24px;
}

.ivu-card-head .ivu-btn {
  float: right;
  margin-top: -6px;
}
</style>
