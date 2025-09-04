// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import {
//   Card,
//   Button,
//   Space,
//   message,
//   Typography,
//   Row,
//   Col,
//   Input,
//   Select,
//   Empty,
//   Spin,
//   Tag,
//   Avatar,
//   Tooltip,
//   Popconfirm,
// } from 'antd';
// import {
//   ArrowLeftOutlined,
//   SearchOutlined,
//   FilterOutlined,
//   EyeOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   UserOutlined,
//   CalendarOutlined,
//   AppstoreOutlined,
//   UnorderedListOutlined,
// } from '@ant-design/icons';
// import { productCustomizationService } from '@/services/product-customization';
// import { productService } from '@/services/product';
// import { CustomizationOptionResponse } from '@/types/product';

// const { Title, Text } = Typography;
// const { Search } = Input;
// const { Option } = Select;

// interface UserProject extends CustomizationOptionResponse {
//   user_id?: number;
//   user_name?: string;
//   user_email?: string;
//   option_type?: string;
//   option_name?: string;
//   design_area?: string;
//   preview_image?: string;
//   option_data?: {
//     product_image_url?: string;
//     design_area?: string;
//     metadata?: {
//       design_name?: string;
//       is_completed?: boolean;
//     };
//   };
// }

// export default function ProductUserProjectsPage() {
//   const router = useRouter();
//   const params = useParams();
//   const productId = Number(params.id);

//   const [projects, setProjects] = useState<UserProject[]>([]);
//   const [filteredProjects, setFilteredProjects] = useState<UserProject[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [productName, setProductName] = useState<string>('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'completed'>('all');
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

//   useEffect(() => {
//     fetchProjects();
//     fetchProductInfo();
//   }, [productId]);

//   useEffect(() => {
//     filterProjects();
//   }, [projects, searchTerm, filterBy]);

//   const fetchProductInfo = async () => {
//     try {
//       const product = await productService.getProductById(productId);
//       setProductName(product.name);
//     } catch (error) {
//       console.error('Failed to fetch product info:', error);
//     }
//   };

//   const fetchProjects = async () => {
//     setLoading(true);
//     try {
//       const data = await productCustomizationService.getAllUserProjectsForProduct(productId);
//       setProjects(data);
//     } catch (error) {
//       message.error('Failed to fetch user projects');
//       console.error('Fetch projects error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterProjects = () => {
//     let filtered = projects;

//     // Apply search filter
//     if (searchTerm) {
//       filtered = filtered.filter(project => 
//         (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (project.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (project.group || '').toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     // Apply category filter
//     if (filterBy === 'recent') {
//       filtered = filtered.sort((a, b) => 
//         new Date(b.updated_at || b.created_at || '').getTime() - 
//         new Date(a.updated_at || a.created_at || '').getTime()
//       ).slice(0, 20);
//     } else if (filterBy === 'completed') {
//       filtered = filtered.filter(project => 
//         project.is_active === true
//       );
//     }

//     setFilteredProjects(filtered);
//   };

//   const handleProjectClick = (project: UserProject) => {
//     // Redirect to the main ecommerce site's design page
//     const designUrl = `http://localhost:3000/products/${project.product_id}/design?option_id=${project.id}`;
//     window.open(designUrl, '_blank');
//   };

//   const handleDeleteProject = async (project: UserProject, e: React.MouseEvent) => {
//     e.stopPropagation();
    
//     try {
//       await productCustomizationService.deleteCustomizationOption(project.id);
//       message.success('Project deleted successfully');
//       fetchProjects();
//     } catch (error) {
//       console.error('Error deleting project:', error);
//       message.error('Failed to delete project');
//     }
//   };

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return 'Unknown';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getDesignAreaDisplayName = (area?: string) => {
//     if (!area) return 'Unknown';
//     const displayNames: { [key: string]: string } = {
//       'front': 'Front',
//       'back': 'Back',
//       'left': 'Left',
//       'right': 'Right'
//     };
//     return displayNames[area.toLowerCase()] || area.charAt(0).toUpperCase() + area.slice(1);
//   };

//   const renderProjectCard = (project: UserProject) => (
//     <Card
//       key={project.id}
//       hoverable
//       onClick={() => handleProjectClick(project)}
//       style={{ cursor: 'pointer' }}
//       cover={
//         <div style={{ height: 200, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           {project.preview_image || project.option_data?.product_image_url ? (
//             <img
//               src={project.preview_image || project.option_data?.product_image_url}
//               alt={project.option_name}
//               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//             />
//           ) : (
//             <EyeOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
//           )}
//         </div>
//       }
//       actions={[
//         <Tooltip title="Edit Design" key="edit">
//           <EditOutlined onClick={(e) => { e.stopPropagation(); handleProjectClick(project); }} />
//         </Tooltip>,
//         <Popconfirm
//           title="Are you sure you want to delete this project?"
//           onConfirm={(e) => handleDeleteProject(project, e!)}
//           onCancel={(e) => e?.stopPropagation()}
//           okText="Yes"
//           cancelText="No"
//           key="delete"
//         >
//           <Tooltip title="Delete Project">
//             <DeleteOutlined 
//               style={{ color: '#ff4d4f' }}
//               onClick={(e) => e.stopPropagation()}
//             />
//           </Tooltip>
//         </Popconfirm>
//       ]}
//     >
//       <Card.Meta
//         avatar={<Avatar icon={<UserOutlined />} />}
//         title={
//           <div>
//             <Text strong>{project.name}</Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               {project.group || 'No Group'}
//             </Text>
//           </div>
//         }
//         description={
//           <div>
//             <div style={{ marginBottom: 8 }}>
//               <Tag color="blue">{project.type}</Tag>
//               {project.is_active && (
//                 <Tag color="green">Active</Tag>
//               )}
//               {project.is_required && (
//                 <Tag color="orange">Required</Tag>
//               )}
//             </div>
//             <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '12px' }}>
//               <CalendarOutlined style={{ marginRight: 4 }} />
//               {formatDate(project.updated_at || project.created_at)}
//             </div>
//           </div>
//         }
//       />
//     </Card>
//   );

//   const renderProjectList = (project: UserProject) => (
//     <Card
//       key={project.id}
//       hoverable
//       onClick={() => handleProjectClick(project)}
//       style={{ cursor: 'pointer', marginBottom: 16 }}
//     >
//       <Row align="middle" gutter={16}>
//         <Col span={3}>
//           <div style={{ width: 60, height: 60, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
//             {project.preview_image || project.option_data?.product_image_url ? (
//               <img
//                 src={project.preview_image || project.option_data?.product_image_url}
//                 alt={project.option_name}
//                 style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
//               />
//             ) : (
//               <EyeOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
//             )}
//           </div>
//         </Col>
//         <Col span={15}>
//           <div>
//             <Text strong>{project.name}</Text>
//             <br />
//             <Text type="secondary">{project.group || 'No Group'}</Text>
//             <br />
//             <div style={{ marginTop: 4 }}>
//               <Tag color="blue">{project.type}</Tag>
//               {project.is_active && (
//                 <Tag color="green">Active</Tag>
//               )}
//               {project.is_required && (
//                 <Tag color="orange">Required</Tag>
//               )}
//             </div>
//           </div>
//         </Col>
//         <Col span={4}>
//           <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
//             <CalendarOutlined style={{ marginRight: 4 }} />
//             <br />
//             {formatDate(project.updated_at || project.created_at)}
//           </div>
//         </Col>
//         <Col span={2}>
//           <Space>
//             <Tooltip title="Edit Design">
//               <Button 
//                 type="text" 
//                 icon={<EditOutlined />} 
//                 onClick={(e) => { e.stopPropagation(); handleProjectClick(project); }}
//               />
//             </Tooltip>
//             <Popconfirm
//               title="Are you sure you want to delete this project?"
//               onConfirm={(e) => handleDeleteProject(project, e!)}
//               onCancel={(e) => e?.stopPropagation()}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button 
//                 type="text" 
//                 danger 
//                 icon={<DeleteOutlined />}
//                 onClick={(e) => e.stopPropagation()}
//               />
//             </Popconfirm>
//           </Space>
//         </Col>
//       </Row>
//     </Card>
//   );

//   return (
//     <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
//       <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
//         {/* Header */}
//         <Card style={{ marginBottom: '24px' }}>
//           <Row justify="space-between" align="middle">
//             <Col>
//               <Button
//                 icon={<ArrowLeftOutlined />}
//                 onClick={() => router.push(`/dashboard/products/${productId}`)}
//                 style={{ marginBottom: '16px' }}
//               >
//                 Back to Product
//               </Button>
//               <Title level={2} style={{ margin: 0 }}>
//                 Customization Options
//               </Title>
//               <Text type="secondary">
//                 All customization options for: {productName}
//               </Text>
//             </Col>
//           </Row>
//         </Card>

//         {/* Filters and Search */}
//         <Card style={{ marginBottom: '24px' }}>
//           <Row gutter={[16, 16]} align="middle">
//             <Col xs={24} sm={12} md={8}>
//               <Search
//                 placeholder="Search projects, users..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 prefix={<SearchOutlined />}
//                 allowClear
//               />
//             </Col>
//             <Col xs={24} sm={6} md={4}>
//               <Select
//                 value={filterBy}
//                 onChange={(value) => setFilterBy(value)}
//                 style={{ width: '100%' }}
//                 prefix={<FilterOutlined />}
//               >
//                 <Option value="all">All Projects</Option>
//                 <Option value="recent">Recent</Option>
//                 <Option value="completed">Completed</Option>
//               </Select>
//             </Col>
//             <Col xs={24} sm={6} md={4}>
//               <Space>
//                 <Button
//                   type={viewMode === 'grid' ? 'primary' : 'default'}
//                   icon={<AppstoreOutlined />}
//                   onClick={() => setViewMode('grid')}
//                 />
//                 <Button
//                   type={viewMode === 'list' ? 'primary' : 'default'}
//                   icon={<UnorderedListOutlined />}
//                   onClick={() => setViewMode('list')}
//                 />
//               </Space>
//             </Col>
//             <Col xs={24} sm={24} md={8}>
//               <Text type="secondary">
//                 Total: {filteredProjects.length} projects
//               </Text>
//             </Col>
//           </Row>
//         </Card>

//         {/* Projects Display */}
//         {loading ? (
//           <Card>
//             <div style={{ textAlign: 'center', padding: '50px' }}>
//               <Spin size="large" />
//               <div style={{ marginTop: 16 }}>Loading projects...</div>
//             </div>
//           </Card>
//         ) : filteredProjects.length === 0 ? (
//           <Card>
//             <Empty
//               image={Empty.PRESENTED_IMAGE_SIMPLE}
//               description={
//                 <div>
//                   <Text>No projects found</Text>
//                   <br />
//                   <Text type="secondary">
//                     {searchTerm || filterBy !== 'all' 
//                       ? 'Try adjusting your search or filter criteria.' 
//                       : 'No users have created customization projects for this product yet.'}
//                   </Text>
//                 </div>
//               }
//             />
//           </Card>
//         ) : (
//           <div>
//             {viewMode === 'grid' ? (
//               <Row gutter={[16, 16]}>
//                 {filteredProjects.map((project) => (
//                   <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
//                     {renderProjectCard(project)}
//                   </Col>
//                 ))}
//               </Row>
//             ) : (
//               <div>
//                 {filteredProjects.map((project) => renderProjectList(project))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Button,
  Space,
  message,
  Typography,
  Row,
  Col,
  Input,
  Select,
  Empty,
  Spin,
  Tag,
  Avatar,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { productCustomizationService } from '@/services/product-customization';
import { productService } from '@/services/product';
import { CustomizationOptionResponse } from '@/types/product';

const { Title, Text } = Typography;
const { Search } = Input;

interface UserProject extends CustomizationOptionResponse {
  user_id?: number;
  user_name?: string;
  user_email?: string;
  option_type?: string;
  option_name?: string;
  design_area?: string;
  preview_image?: string;
  option_data?: {
    product_image_url?: string;
    design_area?: string;
    metadata?: {
      design_name?: string;
      is_completed?: boolean;
    };
  };
}

export default function ProductUserProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [projects, setProjects] = useState<UserProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchProjects();
    fetchProductInfo();
  }, [productId]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, filterBy]);

  const fetchProductInfo = async () => {
    try {
      const product = await productService.getProductById(productId);
      setProductName(product.name);
    } catch (error) {
      console.error('Failed to fetch product info:', error);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await productCustomizationService.getAllUserProjectsForProduct(productId);
      setProjects(data);
    } catch (error) {
      message.error('Failed to fetch user projects');
      console.error('Fetch projects error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.group || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy === 'recent') {
      filtered = [...filtered] // copy to avoid mutating state
        .sort((a, b) =>
          new Date(b.updated_at || b.created_at || '').getTime() -
          new Date(a.updated_at || a.created_at || '').getTime()
        )
        .slice(0, 20);
    } else if (filterBy === 'completed') {
      filtered = filtered.filter(project =>
        project.option_data?.metadata?.is_completed === true
      );
    }

    setFilteredProjects(filtered);
  };

  const handleProjectClick = (project: UserProject) => {
    const designUrl = `http://localhost:3000/products/${project.product_id}/design?option_id=${project.id}`;
    window.open(designUrl, '_blank');
  };

  const handleDeleteProject = async (project: UserProject) => {
    try {
      await productCustomizationService.deleteCustomizationOption(project.id);
      message.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      message.error('Failed to delete project');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderProjectCard = (project: UserProject) => (
    <Card
      key={project.id}
      hoverable
      onClick={() => handleProjectClick(project)}
      style={{ cursor: 'pointer' }}
      cover={
        <div style={{ height: 200, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {project.preview_image || project.option_data?.product_image_url ? (
            <img
              src={project.preview_image || project.option_data?.product_image_url}
              alt={project.option_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <EyeOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          )}
        </div>
      }
      actions={[
        <Tooltip title="Edit Design" key="edit">
          <EditOutlined onClick={(e) => { e.stopPropagation(); handleProjectClick(project); }} />
        </Tooltip>,
        <Popconfirm
          title="Are you sure you want to delete this project?"
          onConfirm={() => handleDeleteProject(project)}
          okText="Yes"
          cancelText="No"
          key="delete"
        >
          <Tooltip title="Delete Project">
            <DeleteOutlined style={{ color: '#ff4d4f' }} onClick={(e) => e.stopPropagation()} />
          </Tooltip>
        </Popconfirm>
      ]}
    >
      <Card.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={<Text strong ellipsis>{project.name}</Text>}
        description={
          <div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="blue">{project.type}</Tag>
              {project.is_active && <Tag color="green">Active</Tag>}
              {project.is_required && <Tag color="orange">Required</Tag>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '12px' }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {formatDate(project.updated_at || project.created_at)}
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderProjectList = (project: UserProject) => (
    <Card
      key={project.id}
      hoverable
      onClick={() => handleProjectClick(project)}
      style={{ cursor: 'pointer', marginBottom: 16 }}
    >
      <Row align="middle" gutter={16}>
        <Col span={3}>
          <div style={{ width: 60, height: 60, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
            {project.preview_image || project.option_data?.product_image_url ? (
              <img
                src={project.preview_image || project.option_data?.product_image_url}
                alt={project.option_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
              />
            ) : (
              <EyeOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
            )}
          </div>
        </Col>
        <Col span={15}>
          <Text strong ellipsis>{project.name}</Text>
          <br />
          <Text type="secondary">{project.group || 'No Group'}</Text>
          <br />
          <div style={{ marginTop: 4 }}>
            <Tag color="blue">{project.type}</Tag>
            {project.is_active && <Tag color="green">Active</Tag>}
            {project.is_required && <Tag color="orange">Required</Tag>}
          </div>
        </Col>
        <Col span={4}>
          <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            <br />
            {formatDate(project.updated_at || project.created_at)}
          </div>
        </Col>
        <Col span={2}>
          <Space>
            <Tooltip title="Edit Design">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={(e) => { e.stopPropagation(); handleProjectClick(project); }}
              />
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this project?"
              onConfirm={() => handleDeleteProject(project)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(`/dashboard/products/${productId}`)}
                style={{ marginBottom: '16px' }}
              >
                Back to Product
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                Customization Options
              </Title>
              <Text type="secondary">All customization options for: {productName}</Text>
            </Col>
          </Row>
        </Card>

        {/* Filters and Search */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search projects, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                value={filterBy}
                onChange={(value) => setFilterBy(value)}
                style={{ width: '100%' }}
                options={[
                  { value: 'all', label: 'All Projects' },
                  { value: 'recent', label: 'Recent' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Space>
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                />
                <Button
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                />
              </Space>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Text type="secondary">Total: {filteredProjects.length} projects</Text>
            </Col>
          </Row>
        </Card>

        {/* Projects Display */}
        {loading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading projects...</div>
            </div>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text>No projects found</Text>
                  <br />
                  <Text type="secondary">
                    {searchTerm || filterBy !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No users have created customization projects for this product yet.'}
                  </Text>
                </div>
              }
            />
          </Card>
        ) : (
          <div>
            {viewMode === 'grid' ? (
              <Row gutter={[16, 16]}>
                {filteredProjects.map((project) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
                    {renderProjectCard(project)}
                  </Col>
                ))}
              </Row>
            ) : (
              <div>
                {filteredProjects.map((project) => renderProjectList(project))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
