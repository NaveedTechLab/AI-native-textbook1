---
sidebar_position: 6
chapter_id: hardware-specifications
---

# Hardware Specifications for Physical AI & Humanoid Robotics


## Introduction to Robotics Hardware

The hardware platform is fundamental to embodied intelligence systems. The choice of hardware directly impacts the capabilities, performance, and applications of a robotic system. This section covers the key hardware components and platforms for physical AI and humanoid robotics.

### Hardware Categories

#### Computing Platforms
- **Edge AI Computers**: For on-board processing
- **Workstation GPUs**: For development and simulation
- **Cloud Platforms**: For training and off-board processing

#### Sensing Hardware
- **Cameras**: RGB, stereo, event-based
- **LiDAR**: 2D and 3D ranging
- **IMU**: Inertial measurement units
- **Force/Torque Sensors**: For manipulation
- **Tactile Sensors**: For fine manipulation

#### Actuation Systems
- **Servo Motors**: Precise position control
- **Brushless Motors**: High power-to-weight ratio
- **Hydraulic/Pneumatic Systems**: High force applications
- **Series Elastic Actuators**: Compliant control

## RTX Workstation Specifications


### Development and Simulation Workstations

#### High-End Workstation (Recommended)
- **GPU**: NVIDIA RTX 4090 (24GB VRAM) or RTX 6000 Ada (48GB VRAM)
- **CPU**: AMD Ryzen 9 7950X or Intel i9-13900K
- **RAM**: 64GB DDR5 (expandable to 128GB)
- **Storage**: 2TB NVMe SSD + 4TB HDD for datasets
- **Power Supply**: 1000W+ 80+ Gold for stable operation
- **Cooling**: High-performance air or liquid cooling

#### Mid-Range Workstation (Minimum)
- **GPU**: NVIDIA RTX 4070 Ti Super (16GB VRAM) or RTX A5000 (24GB VRAM)
- **CPU**: AMD Ryzen 7 7700X or Intel i7-13700K
- **RAM**: 32GB DDR5
- **Storage**: 1TB NVMe SSD
- **Power Supply**: 850W+ 80+ Gold
- **Cooling**: Quality air cooling

### Workstation Applications
- **Simulation**: Running Isaac Sim, Gazebo, Unity with high fidelity
- **Training**: Training neural networks and VLA models
- **Development**: Real-time algorithm development and testing
- **Data Processing**: Synthetic data generation and preprocessing

## NVIDIA Jetson Platform Specifications

### Edge AI Computing for Robotics

#### Jetson AGX Orin (Recommended for High-Performance Robots)
- **GPU**: 2048-core NVIDIA Ampere architecture GPU
- **CPU**: 12-core ARM v8.2 64-bit CPU
- **DL Accelerator**: 73 TOPS AI performance
- **Memory**: 32GB 256-bit LPDDR5 (204.8 GB/s)
- **Power**: 15W to 60W configurable
- **Connectivity**: Dual Gigabit Ethernet, PCIe Gen4 x4, M.2 Key M
- **Video**: Up to 4x 4K60 or 1x 8K30 video encode/decode

#### Jetson Orin NX (Recommended for Medium-Performance Robots)
- **GPU**: 1024-core NVIDIA Ampere architecture GPU
- **CPU**: 8-core ARM v8.2 64-bit CPU
- **DL Accelerator**: 73 TOPS AI performance
- **Memory**: 8GB or 16GB LPDDR5
- **Power**: 10W to 25W configurable
- **Connectivity**: Gigabit Ethernet, PCIe Gen4 x2, M.2 Key M
- **Video**: Up to 2x 4K60 video encode/decode

#### Jetson Orin Nano (Entry-Level Edge AI)
- **GPU**: 40-core NVIDIA Ampere architecture GPU
- **CPU**: 4-core ARM v8.2 64-bit CPU
- **DL Accelerator**: 20 TOPS AI performance
- **Memory**: 4GB or 8GB LPDDR4x
- **Power**: 7W to 15W configurable
- **Connectivity**: Gigabit Ethernet, M.2 Key M
- **Video**: Up to 1x 4K60 or 2x 4K30 video encode/decode

### Jetson Platform Applications
- **On-Board Processing**: Running perception and control algorithms
- **VLA Model Inference**: Executing vision-language-action models
- **Navigation**: Real-time path planning and obstacle avoidance
- **Manipulation**: Real-time control of robotic arms
- **Edge AI**: Processing sensor data without cloud dependency

## Unitree Robot Platforms


### Go2 Quadruped Robot Specifications
- **Degrees of Freedom**: 12 (3 per leg)
- **Joint Motors**: High-torque density actuators
- **On-board Computer**: NVIDIA Jetson Orin NX
- **Sensors**: IMU, stereo cameras, force/torque sensors
- **Battery**: 25.9V/20Ah lithium battery (up to 2 hours)
- **Payload**: 3kg
- **Speed**: Up to 1.6 m/s
- **Communication**: Wi-Fi 6, Bluetooth 5.0, 4G
- **SDK**: ROS 2 support, Python/C++ APIs

### G1 Humanoid Robot Specifications
- **Degrees of Freedom**: 32+ (full-body control)
- **Height**: 1.1m
- **Weight**: 32kg
- **Actuators**: Custom high-performance servo motors
- **On-board Computer**: NVIDIA Jetson AGX Orin
- **Sensors**: Stereo cameras, IMU, force/torque sensors, LiDAR
- **Battery**: 25.9V/20Ah lithium battery (up to 1.5 hours)
- **Walking Speed**: Up to 0.8 m/s
- **Payload**: 5kg
- **Communication**: Wi-Fi, 4G, CAN bus
- **SDK**: ROS 2 support, multiple programming interfaces

### Use Cases for Unitree Platforms
- **Research**: Gait generation, balance control, learning algorithms
- **Education**: Hands-on robotics learning
- **Development**: Testing navigation and manipulation algorithms
- **Demonstration**: Public showcases of humanoid capabilities

## Sensor Hardware Specifications

### Camera Systems
#### RGB Cameras
- **Resolution**: 1080p (1920x1080) to 4K (3840x2160)
- **Frame Rate**: 30-120 FPS
- **Interface**: USB 3.0, GigE, MIPI CSI-2
- **Lens**: Fixed or varifocal depending on application

#### Stereo Cameras
- **Resolution**: 720p to 1080p per camera
- **Baseline**: 10-200mm depending on depth range
- **Depth Range**: 0.3m to 10m
- **Accuracy**: Sub-centimeter at close range

#### Event-Based Cameras
- **Dynamic Range**: >120 dB
- **Latency**: less than 1 ms
- **Resolution**: 304 by 240 to 1280 by 720
- **Applications**: High-speed motion, high-contrast scenes

### LiDAR Sensors
#### 2D LiDAR (Navigation)
- **Range**: 5-25m
- **Resolution**: 0.25° to 1°
- **Scan Rate**: 5-20 Hz
- **Accuracy**: ±1-3cm
- **Examples**: Hokuyo UTM-30LX, Sick TIM571

#### 3D LiDAR (Perception)
- **Range**: 5-100m
- **FOV**: Horizontal: 360°, Vertical: 20-40°
- **Points**: 100k-500k points per second
- **Accuracy**: ±2-3cm
- **Examples**: Velodyne Puck, Ouster OS1, Livox Mid-360

### Inertial Measurement Units (IMU)
- **Gyroscope**: ±250, 500, 1000, 2000 °/s range
- **Accelerometer**: ±2, 4, 8, 16 g range
- **Magnetometer**: ±1300 µT range
- **Update Rate**: 100-1000 Hz
- **Bias Stability**: less than 10 °/h for gyros, less than 1 mg for accels

## Actuator Specifications

### Servo Motors for Manipulation
#### High-Precision Servos
- **Torque**: 10-100 Nm
- **Resolution**: 0.1-0.01°
- **Speed**: 30-120 °/s
- **Control**: Position, velocity, torque
- **Examples**: Dynamixel X-series, Herkulex, Robotis

### Brushless Motors for Mobility
#### Gimbal Motors
- **Torque**: 0.1 to 5 Nm
- **Speed**: 100 to 3000 RPM
- **Precision**: less than 0.1° with proper encoders
- **Applications**: Joint control, pan-tilt units

#### High-Power Motors
- **Torque**: 5 to 50 Nm
- **Speed**: 100 to 1000 RPM
- **Power**: 100W to 2000W
- **Applications**: Wheel drives, high-load joints

## Cloud Robotics Options

### Cloud GPU Services
#### AWS EC2 GPU Instances
- **p4d.24xlarge**: 8x A100 (40GB), 96 vCPUs, 1.15 TB RAM
- **g5.48xlarge**: 8x A10 GPU, 192 vCPUs, 768 GB RAM
- **Applications**: Large model training, simulation scaling

#### Google Cloud Platform
- **A2 Instance Family**: NVIDIA A100 GPUs
- **G2 Instance Family**: NVIDIA L4 GPUs
- **Applications**: AI training, simulation, remote processing

#### Azure GPU Instances
- **ND A100 v4**: 8x NVIDIA A100 (80GB)
- **NCv3 Series**: NVIDIA V100 GPUs
- **Applications**: Deep learning, simulation, data processing

### Edge-to-Cloud Integration
- **Latency Requirements**: less than 50ms for real-time control
- **Bandwidth**: 10 to 100 Mbps for sensor data streaming
- **Security**: End-to-end encryption for data transmission
- **Reliability**: Fallback mechanisms for connectivity loss

## Hardware Selection Guidelines

### For Different Applications

#### Research and Development
- **Priority**: Flexibility, expandability, debugging capabilities
- **Recommendation**: High-end workstation + modular robot platform
- **Budget Focus**: Computing power and sensor diversity

#### Education and Demonstration
- **Priority**: Safety, ease of use, reliability
- **Recommendation**: Mid-range hardware with good support
- **Budget Focus**: Cost-effective platforms with educational value

#### Production Deployment
- **Priority**: Reliability, power efficiency, cost optimization
- **Recommendation**: Proven platforms with industrial support
- **Budget Focus**: Total cost of ownership and maintenance

### Power and Thermal Considerations
- **Power Budget**: Account for peak and sustained power requirements
- **Thermal Management**: Adequate cooling for sustained operation
- **Battery Life**: Balance performance with operational time
- **Efficiency**: Optimize for power-constrained environments

## Integration with Isaac and ROS 2

### Hardware Abstraction Layers
- **ROS 2 Drivers**: Standard interfaces for hardware components
- **Isaac Extensions**: GPU-accelerated hardware interfaces
- **Middleware**: Seamless communication between components

### Real-time Performance
- **Timing Constraints**: Deterministic execution for safety
- **Jitter Minimization**: Consistent response times
- **Resource Management**: CPU/GPU load balancing

## Try With AI

Try asking your AI companion about selecting the right hardware for your specific application, or ask for recommendations on integrating specific sensors with ROS 2. You can also inquire about power optimization strategies for mobile robots or ask for guidance on choosing between different computing platforms based on your requirements.