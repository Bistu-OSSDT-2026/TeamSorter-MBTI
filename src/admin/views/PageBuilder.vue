<template>
  <div class="page-builder">
    <div class="sidebar">
      <h3>素材库</h3>
      <div class="element-item" @click="addElement('text')">
        <p>文本</p>
      </div>
      <div class="element-item" @click="addElement('dropdown')">
        <p>下拉框</p>
      </div>
      <div class="element-item" @click="addElement('checkbox')">
        <p>复选框</p>
      </div>
      <div class="element-item" @click="addElement('fileUpload')">
        <p>附件上传</p>
      </div>
      <div class="element-item" @click="addElement('imageUpload')">
        <p>图片上传转URL</p>
      </div>
    </div>
    <div class="main-content">
      <div class="content">
        <div v-for="(element, index) in pageContent" :key="element.key" class="element">
          <div class="element-header">
            <input type="checkbox" v-model="element.isSelected" @change="selectElement(index)" />
            <span>{{ element.label }}</span>
          </div>
          <div v-if="element.type === 'text'" class="element-body">
            <div class="control-group">
              <label :for="element.key">{{ element.label }}</label>
              <input type="text" :id="element.key" v-model="element.value" :placeholder="'输入' + element.label" />
              <button @click="removeElement(index)" class="remove-button">删除</button>
            </div>
          </div>
          <div v-else-if="element.type === 'dropdown'" class="element-body">
            <div class="control-group">
              <label :for="element.key">{{ element.label }}</label>
              <select :id="element.key" v-model="element.value">
                <option v-for="option in element.options" :key="option.key" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <!-- <button @click="editDropdownOptions(index)" class="edit-button">编辑选项</button> -->
              <button @click="removeElement(index)" class="remove-button">删除</button>
            </div>
          </div>
          <div v-else-if="element.type === 'checkbox'" class="element-body">
            <div class="control-group">
              <label :for="element.key">{{ element.label }}</label>
              <input type="checkbox" :id="element.key" v-model="element.value" />
              <button @click="removeElement(index)" class="remove-button">删除</button>
            </div>
          </div>
          <div v-else-if="element.type === 'imageUpload'" class="element-body">
            <div class="control-group">
              <label :for="element.key">{{ element.label }}</label>
              <input type="file" multiple :id="element.key" @change="handleImageUpload($event, index)" />
              <button @click="removeElement(index)" class="remove-button">删除</button>
              <div class="uploaded-images">
                <div v-for="(img, imgIndex) in element.value" :key="imgIndex">
                  <img :src="img" style="max-width: 100px; margin: 5px;" />
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="element.type === 'fileUpload'" class="element-body">
            <div class="control-group">
              <label :for="element.key">{{ element.label }}</label>
              <input type="file" :id="element.key" @change="handleFileUpload($event, index)" />
              <button @click="removeElement(index)" class="remove-button">删除</button>
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <button @click="savePage" class="save-button">保存页面</button>
      </div>
    </div>
    <div class="sidebar" v-if="selectedElementIndex !== null">
      <h3>编辑属性</h3>
      <div v-if="selectedElement.type === 'text' || selectedElement.type === 'checkbox' || selectedElement.type === 'fileUpload'">
        <div class="form-group">
          <label>名称</label>
          <input type="text" v-model="selectedElement.label" placeholder="输入名称" />
        </div>
        <div class="form-group">
          <label>编码</label>
          <input type="text" v-model="selectedElement.key" placeholder="输入编码" />
        </div>
        <div class="form-group">
          <label>默认值</label>
          <input type="text" v-model="selectedElement.default" placeholder="输入默认值" />
        </div>
      </div>
      <div v-else-if="selectedElement.type === 'dropdown'">
        <div class="form-group">
          <label>名称</label>
          <input type="text" v-model="selectedElement.label" placeholder="输入名称" />
        </div>
        <div class="form-group">
          <label>编码</label>
          <input type="text" v-model="selectedElement.key" placeholder="输入编码" />
        </div>
        <div v-for="(option, optionIndex) in selectedElement.options" :key="option.key" class="option-item">
          <div class="form-group">
            <label>选项名称</label>
            <input type="text" v-model="option.label" placeholder="输入选项名称" />
          </div>
          <div class="form-group">
            <label>选项编码</label>
            <input type="text" v-model="option.value" placeholder="输入选项编码" />
          </div>
          <button @click="removeDropdownOption(optionIndex)" class="remove-button">删除选项</button>
        </div>
        <button @click="addDropdownOption" class="add-button">添加选项</button>
        <div class="form-group">
          <label>默认值</label>
          <input type="text" v-model="selectedElement.default" placeholder="输入默认值" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from "element-plus";
import router from '../router';

const API_BASE = 'http://localhost:5000/api'

export default {
  data() {
    return {
      pageContent: this.getPageContents(),
      selectedElementIndex: null
    };
  },
  computed: {
    selectedElement() {
      return this.selectedElementIndex !== null ? this.pageContent[this.selectedElementIndex] : null;
    }
  },
  methods: {
    addElement(type) {
      let newElement = {};
      switch (type) {
        case 'text':
          newElement = {
            type: 'text',
            key: `text_${Date.now()}`,
            value: '',
            label: 'textfield',
            default: '',
            options: [],
            isSelected: false
          };
          break;
        case 'dropdown':
          newElement = {
            type: 'dropdown',
            key: `dropdown_${Date.now()}`,
            value: '',
            label: 'dropdownfield',
            default: '',
            options: [
              { label: '选项1', value: 'option1', key: 'option1_key' },
              { label: '选项2', value: 'option2', key: 'option2_key' }
            ],
            isSelected: false
          };
          break;
        case 'checkbox':
          newElement = {
            type: 'checkbox',
            key: `checkbox_${Date.now()}`,
            value: false,
            label: 'checkboxfield',
            default: 'false',
            options: [],
            isSelected: false
          };
          break;
        case 'fileUpload':
          newElement = {
            type: 'fileUpload',
            key: `fileUpload_${Date.now()}`,
            value: null,
            label: 'fileUploadfield',
            default: '',
            options: [],
            isSelected: false
          };
          break;
       case 'imageUpload':
          newElement = {
            type: 'imageUpload',
            key: `imageUpload_${Date.now()}`,
            value: [],      // 用于存储上传的图片 URL 数组
            label: '图片上传',
            default: '',
            options: [],
            isSelected: false
          };
          break;   
      }
      this.pageContent.push(newElement);
    },
    selectElement(index) {
      this.selectedElementIndex = index;
    },
    removeElement(index) {
      this.pageContent.splice(index, 1);
      if (this.selectedElementIndex === index) {
        this.selectedElementIndex = null;
      }
    },
    async handleImageUpload(event, index) {
  const files = Array.from(event.target.files || []);
  const urls = [];

  for (const file of files) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    await new Promise((resolve) => {
      reader.onload = () => {
        urls.push(reader.result);
        resolve();
      };
      reader.onerror = () => resolve();
    });
  }

  // 保存到对应元素的 value
  this.pageContent[index].value = urls;
},
    addDropdownOption() {
      const newOption = {
        label: `新选项${this.selectedElement.options.length + 1}`,
        value: `new_option_${this.selectedElement.options.length + 1}`,
        key: `new_option_key_${this.selectedElement.options.length + 1}`
      };
      this.selectedElement.options.push(newOption);
    },
    removeDropdownOption(optionIndex) {
      this.selectedElement.options.splice(optionIndex, 1);
    },
   savePage() {
  fetch(`${API_BASE}/saveAppMeta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      appId: sessionStorage.getItem('appId'),
      metaInfo: this.pageContent.map(item => {
        const obj = Object.keys(item).reduce((acc, key) => {
          if (key !== 'isSelected') acc[key] = item[key];
          return acc;
        }, {});

        // 如果是图片上传类型，把 value 转成字符串
        if (obj.type === 'imageUpload' && Array.isArray(obj.value)) {
          obj.value = JSON.stringify(obj.value);
        }

        return obj;
      })
    })
  })
  .then(response => {
    if (!response.ok) {
      ElMessage.error('网络响应错误' + response.status);
    }
    return response.json();
  })
  .then(data => {
    console.log('保存成功:', data);
    ElMessage.success('页面信息保存成功');
    this.routerPush('/admin/apps-list');
  })
  .catch(error => {
    ElMessage.error('保存页面信息时发生错误，请稍后再试。', error);
  });
},

    getPageContents() {
      const appId = sessionStorage.getItem('appId');

      if (!appId) {
        ElMessage.error('appId 未定义');
        this.pageContent = [];
        return;
      }

      fetch(`${API_BASE}/getAppMeta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appId })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`网络响应错误: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        this.pageContent = data.metaInfo.map(item => ({
          ...item,
          isSelected: false
        }));
        ElMessage.success('页面内容获取成功');
      })
      .catch(error => {
        console.error('获取页面内容时发生错误:', error);
        ElMessage.error('获取页面内容时发生错误，请稍后再试。');
        this.pageContent = [];
      });
    },
    routerPush(path) {
      router.push(path);
    }
  }
};
</script>

<style scoped>
.page-builder {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 200px;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-y: auto;
}

.form-group {
    display: inline-block;
}

.element-item {
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  cursor: pointer;
  margin-bottom: 5px;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.header {
  height: 5%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-right: 10px;
}

.content {
  flex-grow: 1;
  padding: 10px;
  overflow-y: auto;
  border: 2px dashed #ccc;
}

.footer {
  height: 5%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.element {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
}

.element-header {
  display: flex;
  align-items: center;
  gap: 5px;
}

.element-body {
  display: flex;
  gap: 5px;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap; /* 确保控件在同一行 */
}

.remove-button {
  margin-left: 5px;
  margin-top: 5px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.edit-button {
  margin-left: 5px;
  margin-top: 5px;
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.save-button {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 5px;
}
</style>