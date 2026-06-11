<template>
  <div class="page-container">
服务器运行在 http://localhost:7002    <el-card class="table-card">
      <div class="page-title">设备借还管理</div>

      <div class="search-row">
        <el-select v-model="searchForm.status" placeholder="设备状态" clearable class="search-select">
          <el-option label="全部" :value="null" />
          <el-option label="在库-可用" value="available" />
          <el-option label="在库-待维修" value="maintenance" />
          <el-option label="在库-已预约" value="reserved" />
          <el-option label="已借出" value="borrowed" />
          <el-option label="送修中" value="repairing" />
          <el-option label="已报废" value="scrapped" />
          <el-option label="已丢失" value="lost" />
        </el-select>
        <el-select v-model="searchForm.category_id" placeholder="设备分类" clearable class="search-select">
          <el-option label="全部" :value="null" />
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-input v-model="searchForm.keyword" placeholder="设备名称/资产编号" clearable class="search-input" />
      </div>

      <div class="button-row">
        <el-button type="success" @click="loadData">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button type="default" @click="resetSearch">
          <el-icon><Refresh /></el-icon>重置
        </el-button>
        <el-button type="primary" @click="loadBorrowRecords">
          <el-icon><List /></el-icon>查看借还记录
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="asset_code" label="资产编号" width="140" />
        <el-table-column prop="name" label="设备名称" width="180" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="model" label="型号" width="150" />
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            <el-tag v-if="row.is_important" type="danger" size="small">重要设备</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="借用信息" width="200">
          <template #default="{ row }">
            <div v-if="row.current_borrow">
              <div>借用人: {{ row.current_borrow.applicant_name }}</div>
              <div>借用日期: {{ formatDate(row.current_borrow.borrow_date) }}</div>
              <el-tag v-if="row.current_borrow.is_overdue" type="danger" size="small">已逾期</el-tag>
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'available'">
              <el-button type="primary" size="small" @click="handleBorrow(row)">借出申请</el-button>
            </template>
            <template v-else-if="row.status === 'reserved'">
              <el-button type="success" size="small" @click="handleReceive(row)">领取确认</el-button>
            </template>
            <template v-else-if="row.status === 'borrowed'">
              <el-button type="success" size="small" @click="handleReturn(row)">归还验收</el-button>
              <el-button type="warning" size="small" @click="handleRenew(row)">续借申请</el-button>
            </template>
            <template v-else>
              <el-button type="info" size="small" @click="handleDetail(row)">查看详情</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <!-- 借出申请对话框 -->
    <el-dialog title="借出申请" v-model="applyDialogVisible" width="650px">
      <el-form :model="applyForm" ref="applyFormRef" :rules="applyRules" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="applyForm.equipment_name" disabled />
        </el-form-item>
        <el-form-item label="资产编号">
          <el-input v-model="applyForm.asset_code" disabled />
        </el-form-item>
        <el-form-item label="重要设备">
          <el-tag :type="applyForm.is_important ? 'danger' : 'info'">{{ applyForm.is_important ? '是' : '否' }}</el-tag>
        </el-form-item>
        <el-form-item label="申请人姓名" prop="applicant_name">
          <el-input v-model="applyForm.applicant_name" placeholder="请输入申请人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="applicant_phone">
          <el-input v-model="applyForm.applicant_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="是否学生">
          <el-switch v-model="applyForm.is_student" />
        </el-form-item>
        <el-form-item label="是否需要导师审批">
          <el-switch v-model="applyForm.need_teacher_approval" />
        </el-form-item>
        <template v-if="applyForm.need_teacher_approval">
          <el-form-item label="导师姓名" prop="teacher_name">
            <el-input v-model="applyForm.teacher_name" placeholder="请输入导师姓名" />
          </el-form-item>
        </template>
        <el-form-item label="借用日期" prop="borrow_date">
          <el-date-picker v-model="applyForm.borrow_date" type="datetime" placeholder="请选择借用日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预计归还日期" prop="expect_return_date">
          <el-date-picker v-model="applyForm.expect_return_date" type="datetime" placeholder="请选择预计归还日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="使用地点" prop="use_place">
          <el-input v-model="applyForm.use_place" placeholder="请输入使用地点" />
        </el-form-item>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="applyForm.purpose" type="textarea" :rows="3" placeholder="请输入用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitApply">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 领取确认对话框 -->
    <el-dialog title="领取确认" v-model="receiveDialogVisible" width="600px">
      <el-form :model="receiveForm" ref="receiveFormRef" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="receiveForm.equipment_name" disabled />
        </el-form-item>
        <el-form-item label="资产编号">
          <el-input v-model="receiveForm.asset_code" disabled />
        </el-form-item>
        <el-form-item label="借用人">
          <el-input v-model="receiveForm.applicant_name" disabled />
        </el-form-item>
        <el-form-item label="领取人" prop="receive_user_name">
          <el-input v-model="receiveForm.receive_user_name" placeholder="请输入领取人姓名" />
        </el-form-item>
        <el-form-item label="设备状态">
          <el-radio-group v-model="receiveForm.check_status">
            <el-radio label="normal">正常</el-radio>
            <el-radio label="has_damage">有损坏</el-radio>
            <el-radio label="missing_parts">缺配件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="receiveForm.receive_remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReceive">确认领取</el-button>
      </template>
    </el-dialog>

    <!-- 归还验收对话框 -->
    <el-dialog title="归还验收" v-model="returnDialogVisible" width="600px">
      <el-form :model="returnForm" ref="returnFormRef" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="returnForm.equipment_name" disabled />
        </el-form-item>
        <el-form-item label="资产编号">
          <el-input v-model="returnForm.asset_code" disabled />
        </el-form-item>
        <el-form-item label="借用人">
          <el-input v-model="returnForm.applicant_name" disabled />
        </el-form-item>
        <el-form-item label="归还人" prop="return_user_name">
          <el-input v-model="returnForm.return_user_name" placeholder="请输入归还人姓名" />
        </el-form-item>
        <el-form-item label="验收人" prop="accept_user_name">
          <el-input v-model="returnForm.accept_user_name" placeholder="请输入验收人姓名" />
        </el-form-item>
        <el-form-item label="归还状态" prop="return_status">
          <el-radio-group v-model="returnForm.return_status">
            <el-radio label="returned">完好</el-radio>
            <el-radio label="damaged">损坏</el-radio>
            <el-radio label="missing_parts">缺件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="归还备注">
          <el-input v-model="returnForm.return_condition" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReturn">验收完成</el-button>
      </template>
    </el-dialog>

    <!-- 续借申请对话框 -->
    <el-dialog title="续借申请" v-model="renewDialogVisible" width="600px">
      <el-form :model="renewForm" ref="renewFormRef" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="renewForm.equipment_name" disabled />
        </el-form-item>
        <el-form-item label="原归还日期">
          <el-input :value="formatDate(currentBorrowRecord?.expect_return_date)" disabled />
        </el-form-item>
        <el-form-item label="新归还日期" prop="new_return_date">
          <el-date-picker v-model="renewForm.new_return_date" type="datetime" placeholder="请选择新归还日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="续借原因" prop="renew_reason">
          <el-input v-model="renewForm.renew_reason" type="textarea" :rows="3" placeholder="请输入续借原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRenew">提交续借</el-button>
      </template>
    </el-dialog>

    <!-- 借还记录对话框 -->
    <el-dialog title="借还记录" v-model="recordDialogVisible" width="1200px">
      <el-tabs v-model="recordTabActive">
        <el-tab-pane label="借还记录" name="borrow">
          <div class="record-search">
            <el-select v-model="recordSearchForm.status" placeholder="记录状态" clearable class="search-select">
              <el-option label="全部" :value="null" />
              <el-option label="待审批" value="pending" />
              <el-option label="待导师审批" value="pending_teacher" />
              <el-option label="待管理员审批" value="pending_admin" />
              <el-option label="已审批" value="approved" />
              <el-option label="已拒绝" value="rejected" />
              <el-option label="已借出" value="borrowed" />
              <el-option label="已归还" value="returned" />
              <el-option label="逾期" value="overdue" />
            </el-select>
            <el-button type="primary" @click="loadBorrowRecords">查询</el-button>
          </div>
          <el-table :data="borrowRecords" border stripe max-height="500">
            <el-table-column prop="borrow_code" label="申请编号" width="120" />
            <el-table-column prop="equipment_name" label="设备名称" width="150" />
            <el-table-column prop="applicant_name" label="借用人" width="120" />
            <el-table-column label="借用日期" width="180">
              <template #default="{ row }">
                {{ formatDate(row.borrow_date) }}
              </template>
            </el-table-column>
            <el-table-column label="预计归还" width="180">
              <template #default="{ row }">
                {{ formatDate(row.expect_return_date) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="140">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 'pending_teacher'">
                  <el-button type="success" size="small" @click="handleTeacherApprove(row)">导师审批</el-button>
                </template>
                <template v-else-if="row.status === 'pending_admin'">
                  <el-button type="success" size="small" @click="handleAdminApprove(row)">管理员审批</el-button>
                </template>
                <el-button type="primary" size="small" @click="handleRecordDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="续借申请" name="renew">
          <div class="record-search">
            <el-select v-model="renewSearchForm.status" placeholder="申请状态" clearable class="search-select">
              <el-option label="全部" :value="null" />
              <el-option label="待审批" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
            <el-button type="primary" @click="loadRenewRecords">查询</el-button>
          </div>
          <el-table :data="renewRecords" border stripe max-height="500">
            <el-table-column prop="renew_code" label="申请编号" width="120" />
            <el-table-column prop="equipment_name" label="设备名称" width="150" />
            <el-table-column prop="applicant_name" label="申请人" width="120" />
            <el-table-column label="原归还日期" width="180">
              <template #default="{ row }">
                {{ formatDate(row.original_return_date) }}
              </template>
            </el-table-column>
            <el-table-column label="新归还日期" width="180">
              <template #default="{ row }">
                {{ formatDate(row.new_return_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="renew_reason" label="续借原因" width="200" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getRenewStatusType(row.status)">{{ getRenewStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 'pending'">
                  <el-button type="success" size="small" @click="handleRenewApprove(row)">审批</el-button>
                </template>
                <el-button type="primary" size="small" @click="handleRenewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="recordDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog title="审批" v-model="approveDialogVisible" width="550px">
      <el-form :model="approveForm" ref="approveFormRef" label-width="120px">
        <el-form-item label="申请编号">
          <el-input v-model="approveForm.borrow_code" disabled />
        </el-form-item>
        <el-form-item label="审批类型">
          <el-tag :type="approveForm.approve_type === 'teacher' ? 'warning' : 'primary'">
            {{ approveForm.approve_type === 'teacher' ? '导师审批' : '管理员审批' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审批结果" prop="approval_status">
          <el-radio-group v-model="approveForm.approval_status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="修改借用时间">
          <el-date-picker v-model="approveForm.new_borrow_date" type="datetime" placeholder="可修改借用时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="修改归还时间">
          <el-date-picker v-model="approveForm.new_return_date" type="datetime" placeholder="可修改归还时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.approval_comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitApprove">确认审批</el-button>
      </template>
    </el-dialog>

    <!-- 续借审批对话框 -->
    <el-dialog title="续借审批" v-model="renewApproveDialogVisible" width="550px">
      <el-form :model="renewApproveForm" ref="renewApproveFormRef" label-width="120px">
        <el-form-item label="申请编号">
          <el-input v-model="renewApproveForm.renew_code" disabled />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="renewApproveForm.equipment_name" disabled />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="renewApproveForm.applicant_name" disabled />
        </el-form-item>
        <el-form-item label="原归还日期">
          <el-input :value="formatDate(renewApproveForm.original_return_date)" disabled />
        </el-form-item>
        <el-form-item label="新归还日期">
          <el-input :value="formatDate(renewApproveForm.new_return_date)" disabled />
        </el-form-item>
        <el-form-item label="续借原因">
          <el-input v-model="renewApproveForm.renew_reason" type="textarea" :rows="2" disabled />
        </el-form-item>
        <el-form-item label="审批结果" prop="approval_status">
          <el-radio-group v-model="renewApproveForm.approval_status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="renewApproveForm.approval_comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewApproveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRenewApprove">确认审批</el-button>
      </template>
    </el-dialog>

    <!-- 续借详情对话框 -->
    <el-dialog title="续借申请详情" v-model="renewDetailDialogVisible" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请编号">{{ currentRenewRecord?.renew_code }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentRenewRecord?.equipment_name }}</el-descriptions-item>
        <el-descriptions-item label="资产编号">{{ currentRenewRecord?.asset_code }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentRenewRecord?.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="原归还日期">{{ formatDate(currentRenewRecord?.original_return_date) }}</el-descriptions-item>
        <el-descriptions-item label="新归还日期">{{ formatDate(currentRenewRecord?.new_return_date) }}</el-descriptions-item>
        <el-descriptions-item label="续借原因" :span="2">{{ currentRenewRecord?.renew_reason }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getRenewStatusType(currentRenewRecord?.status)">{{ getRenewStatusText(currentRenewRecord?.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审批人">{{ currentRenewRecord?.approval_user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ formatDate(currentRenewRecord?.approval_time) }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2">{{ currentRenewRecord?.approval_comment || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="renewDetailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog title="设备详情" v-model="detailDialogVisible" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="资产编号">{{ currentEquipment?.asset_code }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentEquipment?.name }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentEquipment?.category_name }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ currentEquipment?.model }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentEquipment?.brand }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentEquipment?.status)">{{ getStatusText(currentEquipment?.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="规格型号" :span="2">{{ currentEquipment?.specification }}</el-descriptions-item>
        <el-descriptions-item label="购买日期">{{ formatDate(currentEquipment?.purchase_date) }}</el-descriptions-item>
        <el-descriptions-item label="价格">{{ currentEquipment?.price ? '¥' + currentEquipment.price : '-' }}</el-descriptions-item>
        <el-descriptions-item label="存放位置" :span="2">{{ currentEquipment?.location }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentEquipment?.responsible_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用年限">{{ currentEquipment?.use_years || '-' }}年</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentEquipment?.supplier || '-' }}</el-descriptions-item>
        <el-descriptions-item label="保修期">{{ currentEquipment?.warranty_period || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentEquipment?.description || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 借还记录详情对话框 -->
    <el-dialog title="借还记录详情" v-model="recordDetailDialogVisible" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请编号">{{ currentBorrowRecord?.borrow_code }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentBorrowRecord?.equipment_name }}</el-descriptions-item>
        <el-descriptions-item label="资产编号">{{ currentBorrowRecord?.asset_code }}</el-descriptions-item>
        <el-descriptions-item label="借用人">{{ currentBorrowRecord?.applicant_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentBorrowRecord?.applicant_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentBorrowRecord?.status)">{{ getStatusText(currentBorrowRecord?.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="借用日期">{{ formatDate(currentBorrowRecord?.borrow_date) }}</el-descriptions-item>
        <el-descriptions-item label="预计归还日期">{{ formatDate(currentBorrowRecord?.expect_return_date) }}</el-descriptions-item>
        <el-descriptions-item label="实际归还日期">{{ formatDate(currentBorrowRecord?.actual_return_date) }}</el-descriptions-item>
        <el-descriptions-item label="使用地点">{{ currentBorrowRecord?.use_place || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用途" :span="2">{{ currentBorrowRecord?.purpose || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentBorrowRecord?.quantity || 1 }}</el-descriptions-item>
        <el-descriptions-item label="是否需要导师审批">{{ currentBorrowRecord?.is_supervised ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="导师姓名">{{ currentBorrowRecord?.supervisor_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ currentBorrowRecord?.approval_user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ formatDate(currentBorrowRecord?.approval_time) }}</el-descriptions-item>
        <el-descriptions-item label="审批意见">{{ currentBorrowRecord?.approval_comment || '-' }}</el-descriptions-item>
        <el-descriptions-item label="领取人">{{ currentBorrowRecord?.receive_user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="领取时间">{{ formatDate(currentBorrowRecord?.receive_time) }}</el-descriptions-item>
        <el-descriptions-item label="归还人">{{ currentBorrowRecord?.return_user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="归还状态">{{ currentBorrowRecord?.return_status ? (currentBorrowRecord.return_status === 'returned' ? '完好' : currentBorrowRecord.return_status === 'damaged' ? '损坏' : '缺件') : '-' }}</el-descriptions-item>
        <el-descriptions-item label="归还备注" :span="2">{{ currentBorrowRecord?.return_condition || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentBorrowRecord?.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="recordDetailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, List } from '@element-plus/icons-vue'
import { get, post, put } from '@/utils/request'

const loading = ref(false)
const applyDialogVisible = ref(false)
const receiveDialogVisible = ref(false)
const returnDialogVisible = ref(false)
const renewDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const recordDetailDialogVisible = ref(false)
const renewApproveDialogVisible = ref(false)
const renewDetailDialogVisible = ref(false)
const applyFormRef = ref(null)
const receiveFormRef = ref(null)
const returnFormRef = ref(null)
const renewFormRef = ref(null)
const approveFormRef = ref(null)
const renewApproveFormRef = ref(null)

const tableData = ref([])
const categoryList = ref([])
const borrowRecords = ref([])
const renewRecords = ref([])
const currentEquipment = ref(null)
const currentBorrowRecord = ref(null)
const currentRenewRecord = ref(null)
const recordTabActive = ref('borrow')

const searchForm = reactive({
  status: null,
  category_id: null,
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const recordSearchForm = reactive({
  status: null
})

const renewSearchForm = reactive({
  status: null
})

const applyForm = reactive({
  equipment_id: null,
  equipment_name: '',
  asset_code: '',
  is_important: false,
  is_student: false,
  need_teacher_approval: false,
  teacher_name: '',
  applicant_name: '',
  applicant_phone: '',
  borrow_date: '',
  expect_return_date: '',
  use_place: '',
  purpose: '',
  quantity: 1
})

const receiveForm = reactive({
  equipment_id: null,
  equipment_name: '',
  asset_code: '',
  applicant_name: '',
  receive_user_name: '',
  check_status: 'normal',
  receive_remark: ''
})

const returnForm = reactive({
  equipment_id: null,
  equipment_name: '',
  asset_code: '',
  applicant_name: '',
  return_user_name: '',
  accept_user_name: '',
  return_status: 'returned',
  return_condition: ''
})

const renewForm = reactive({
  equipment_id: null,
  equipment_name: '',
  new_return_date: '',
  renew_reason: ''
})

const approveForm = reactive({
  borrow_code: '',
  approve_type: '',
  approval_status: 'approved',
  approval_comment: '',
  new_borrow_date: '',
  new_return_date: ''
})

const renewApproveForm = reactive({
  id: null,
  renew_code: '',
  equipment_name: '',
  applicant_name: '',
  original_return_date: '',
  new_return_date: '',
  renew_reason: '',
  approval_status: 'approved',
  approval_comment: ''
})

const applyRules = {
  applicant_name: [{ required: true, message: '请输入申请人姓名', trigger: 'blur' }],
  borrow_date: [{ required: true, message: '请选择借用日期', trigger: 'change' }],
  expect_return_date: [{ required: true, message: '请选择预计归还日期', trigger: 'change' }],
  use_place: [{ required: true, message: '请输入使用地点', trigger: 'blur' }],
  purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      status: searchForm.status,
      category_id: searchForm.category_id,
      keyword: searchForm.keyword,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await get('/equipment', params)
    const equipmentList = res?.data || res || []
    
    // 为每个设备获取当前借用信息（包括已审批和已借出状态）
    for (const item of equipmentList) {
      try {
        const borrowRes = await get('/equipment/borrow', { equipment_id: item.id })
        const borrowList = borrowRes?.data || []
        // 优先查找已审批但未领取的记录（状态为approved）
        const approvedRecord = borrowList.find(b => b.status === 'approved')
        if (approvedRecord) {
          item.current_borrow = approvedRecord
        } else {
          // 查找已借出的记录（状态为borrowed）
          const borrowedRecord = borrowList.find(b => b.status === 'borrowed')
          if (borrowedRecord) {
            item.current_borrow = borrowedRecord
            // 检查是否逾期
            const expectReturn = new Date(borrowedRecord.expect_return_date)
            const now = new Date()
            item.current_borrow.is_overdue = expectReturn < now
          }
        }
      } catch (e) {
        console.error('获取设备借用信息失败:', e)
        item.current_borrow = null
      }
    }
    
    tableData.value = equipmentList
    pagination.total = res?.total || (res?.data ? equipmentList.length : 0)
  } catch (error) {
    console.error('加载设备列表失败:', error)
    ElMessage.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await get('/equipment/categories')
    categoryList.value = res || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadBorrowRecords = async () => {
  try {
    const params = recordSearchForm.status ? { status: recordSearchForm.status } : {}
    const res = await get('/equipment/borrow', params)
    borrowRecords.value = res?.data || []
    // 同时加载续借申请列表
    await loadRenewRecords()
    recordDialogVisible.value = true
  } catch (error) {
    console.error('加载借还记录失败:', error)
    ElMessage.error('加载借还记录失败')
  }
}

const resetSearch = () => {
  searchForm.status = null
  searchForm.category_id = null
  searchForm.keyword = ''
  pagination.page = 1
  loadData()
}

const handleBorrow = (row) => {
  Object.keys(applyForm).forEach(key => {
    if (key === 'need_teacher_approval' || key === 'is_student' || key === 'is_important') {
      applyForm[key] = false
    } else if (key === 'quantity') {
      applyForm[key] = 1
    } else {
      applyForm[key] = ''
    }
  })
  applyForm.equipment_id = row.id
  applyForm.equipment_name = row.name
  applyForm.asset_code = row.asset_code
  applyForm.is_important = row.is_important || false
  // 重要设备或学生用户需要导师审批
  applyForm.need_teacher_approval = applyForm.is_important || applyForm.is_student
  applyDialogVisible.value = true
}

const handleSubmitApply = async () => {
  try {
    const data = {
      ...applyForm,
      status: applyForm.need_teacher_approval ? 'pending_teacher' : 'pending_admin'
    }
    await post('/equipment/borrow', data)
    ElMessage.success('申请提交成功')
    applyDialogVisible.value = false
    loadData()
    loadBorrowRecords()
  } catch (error) {
    console.error('提交申请失败:', error)
    ElMessage.error('提交申请失败')
  }
}

const handleReceive = async (row) => {
  try {
    // 如果当前没有借用记录，尝试重新获取
    if (!row.current_borrow) {
      const borrowRes = await get('/equipment/borrow', { equipment_id: row.id })
      const borrowList = borrowRes?.data || []
      const approvedRecord = borrowList.find(b => b.status === 'approved')
      if (approvedRecord) {
        row.current_borrow = approvedRecord
      } else {
        ElMessage.error('未找到可用的借用记录')
        return
      }
    }
    Object.keys(receiveForm).forEach(key => {
      receiveForm[key] = ''
    })
    receiveForm.equipment_id = row.id
    receiveForm.equipment_name = row.name
    receiveForm.asset_code = row.asset_code
    receiveForm.applicant_name = row.current_borrow.applicant_name
    receiveForm.check_status = 'normal'
    currentBorrowRecord.value = row.current_borrow
    receiveDialogVisible.value = true
  } catch (error) {
    console.error('获取借用记录失败:', error)
    ElMessage.error('获取借用记录失败')
  }
}

const handleSubmitReceive = async () => {
  try {
    if (!currentBorrowRecord.value) {
      ElMessage.error('未找到借用记录')
      return
    }
    await put(`/equipment/borrow/${currentBorrowRecord.value.id}/receive`, receiveForm)
    ElMessage.success('领取确认成功')
    receiveDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('领取确认失败:', error)
    ElMessage.error('领取确认失败')
  }
}

const handleReturn = (row) => {
  if (!row.current_borrow) {
    ElMessage.error('未找到借用记录')
    return
  }
  Object.keys(returnForm).forEach(key => {
    returnForm[key] = ''
  })
  returnForm.equipment_id = row.id
  returnForm.equipment_name = row.name
  returnForm.asset_code = row.asset_code
  returnForm.applicant_name = row.current_borrow.applicant_name
  returnForm.return_status = 'returned'
  currentBorrowRecord.value = row.current_borrow
  returnDialogVisible.value = true
}

const handleSubmitReturn = async () => {
  try {
    if (!currentBorrowRecord.value) {
      ElMessage.error('未找到借用记录')
      return
    }
    await put(`/equipment/borrow/${currentBorrowRecord.value.id}/return`, returnForm)
    ElMessage.success('归还验收成功')
    returnDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('归还验收失败:', error)
    ElMessage.error('归还验收失败')
  }
}

const handleRenew = (row) => {
  if (!row.current_borrow) {
    ElMessage.error('未找到借用记录')
    return
  }
  Object.keys(renewForm).forEach(key => {
    renewForm[key] = ''
  })
  renewForm.equipment_id = row.id
  renewForm.equipment_name = row.name
  currentBorrowRecord.value = row.current_borrow
  renewDialogVisible.value = true
}

const handleSubmitRenew = async () => {
  try {
    if (!renewForm.new_return_date) {
      ElMessage.error('请选择新归还日期')
      return
    }
    if (!renewForm.renew_reason) {
      ElMessage.error('请输入续借原因')
      return
    }
    
    const data = {
      borrow_record_id: currentBorrowRecord.value.id,
      equipment_id: renewForm.equipment_id,
      equipment_name: renewForm.equipment_name,
      asset_code: currentBorrowRecord.value.asset_code,
      applicant_id: currentBorrowRecord.value.applicant_id,
      applicant_name: currentBorrowRecord.value.applicant_name,
      original_return_date: currentBorrowRecord.value.expect_return_date,
      new_return_date: renewForm.new_return_date,
      renew_reason: renewForm.renew_reason
    }
    
    await post('/equipment/renew', data)
    ElMessage.success('续借申请已提交，等待管理员审批')
    renewDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('续借申请失败:', error)
    ElMessage.error('续借申请失败')
  }
}

const handleTeacherApprove = (row) => {
  approveForm.borrow_code = row.borrow_code
  approveForm.approve_type = 'teacher'
  approveForm.approval_status = 'approved'
  approveForm.approval_comment = ''
  approveForm.new_borrow_date = row.borrow_date
  approveForm.new_return_date = row.expect_return_date
  currentBorrowRecord.value = row
  approveDialogVisible.value = true
}

const handleAdminApprove = (row) => {
  approveForm.borrow_code = row.borrow_code
  approveForm.approve_type = 'admin'
  approveForm.approval_status = 'approved'
  approveForm.approval_comment = ''
  approveForm.new_borrow_date = row.borrow_date
  approveForm.new_return_date = row.expect_return_date
  currentBorrowRecord.value = row
  approveDialogVisible.value = true
}

const handleSubmitApprove = async () => {
  try {
    if (!currentBorrowRecord.value) {
      ElMessage.error('未找到借用记录')
      return
    }
    const data = {
      approval_status: approveForm.approval_status,
      approval_comment: approveForm.approval_comment,
      is_supervised: approveForm.approve_type === 'teacher'
    }
    await put(`/equipment/borrow/${currentBorrowRecord.value.id}/approve`, data)
    ElMessage.success('审批成功')
    approveDialogVisible.value = false
    loadBorrowRecords()
    loadData()
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error('审批失败')
  }
}

// 加载续借申请列表
const loadRenewRecords = async () => {
  try {
    const params = renewSearchForm.status ? { status: renewSearchForm.status } : {}
    const res = await get('/equipment/renew', params)
    renewRecords.value = res?.data || []
  } catch (error) {
    console.error('加载续借申请列表失败:', error)
    ElMessage.error('加载续借申请列表失败')
  }
}

// 续借审批
const handleRenewApprove = (row) => {
  renewApproveForm.id = row.id
  renewApproveForm.renew_code = row.renew_code
  renewApproveForm.equipment_name = row.equipment_name
  renewApproveForm.applicant_name = row.applicant_name
  renewApproveForm.original_return_date = row.original_return_date
  renewApproveForm.new_return_date = row.new_return_date
  renewApproveForm.renew_reason = row.renew_reason
  renewApproveForm.approval_status = 'approved'
  renewApproveForm.approval_comment = ''
  currentRenewRecord.value = row
  renewApproveDialogVisible.value = true
}

// 提交续借审批
const handleSubmitRenewApprove = async () => {
  try {
    if (!renewApproveForm.id) {
      ElMessage.error('未找到续借申请')
      return
    }
    const data = {
      approval_status: renewApproveForm.approval_status,
      approval_comment: renewApproveForm.approval_comment
    }
    await put(`/equipment/renew/${renewApproveForm.id}/approve`, data)
    ElMessage.success('审批成功')
    renewApproveDialogVisible.value = false
    loadRenewRecords()
    loadData()
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error('审批失败')
  }
}

// 续借详情
const handleRenewDetail = (row) => {
  currentRenewRecord.value = row
  renewDetailDialogVisible.value = true
}

// 续借状态类型
const getRenewStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

// 续借状态文本
const getRenewStatusText = (status) => {
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const handleRecordDetail = (row) => {
  currentBorrowRecord.value = row
  recordDetailDialogVisible.value = true
}

const handleDetail = (row) => {
  currentEquipment.value = row
  detailDialogVisible.value = true
}

const getStatusType = (status) => {
  const map = {
    available: 'success',
    maintenance: 'warning',
    reserved: 'info',
    borrowed: 'danger',
    repairing: 'warning',
    scrapped: 'danger',
    lost: 'danger',
    pending: 'warning',
    pending_teacher: 'warning',
    pending_admin: 'warning',
    approved: 'info',
    rejected: 'danger',
    returned: 'success',
    overdue: 'danger',
    damaged: 'danger',
    missing_parts: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    available: '在库-可用',
    maintenance: '在库-待维修',
    reserved: '在库-已预约',
    borrowed: '已借出',
    repairing: '送修中',
    scrapped: '已报废',
    lost: '已丢失',
    pending: '待审批',
    pending_teacher: '待导师审批',
    pending_admin: '待管理员审批',
    approved: '已审批',
    rejected: '已拒绝',
    returned: '已归还',
    overdue: '逾期',
    damaged: '损坏',
    missing_parts: '缺件'
  }
  return map[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.button-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.record-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  width: 220px;
}

.search-select {
  width: 150px;
}
</style>
