terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
  backend "s3" {
    bucket         = "hrms-terraform-state"
    key            = "hrms/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "hrms-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "hrms"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "hrms-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_dns_hostnames = true
  enable_dns_support   = true
}

module "rds" {
  source = "./modules/rds"

  identifier     = "hrms-${var.environment}"
  engine_version = "16.3"
  instance_class = var.rds_instance_class
  db_name        = "hrms"
  db_username    = "hrms"
  db_password    = random_password.db_password.result

  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  allowed_sg_ids  = [module.eks.node_security_group_id]
}

module "redis" {
  source = "./modules/redis"

  cluster_id     = "hrms-${var.environment}"
  node_type      = var.redis_node_type
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnets
  allowed_sg_ids = [module.eks.node_security_group_id]
}

module "s3" {
  source = "./modules/s3"

  bucket_name = "hrms-documents-${var.environment}-${data.aws_caller_identity.current.account_id}"
  environment = var.environment
}

module "ecr" {
  source = "./modules/ecr"

  repositories = ["hrms-api", "hrms-web", "hrms-worker", "hrms-pdf-service"]
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "hrms-${var.environment}"
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      min_size       = 2
      max_size       = 10
      desired_size   = 3
      instance_types = [var.eks_node_instance_type]
    }
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "hrms" {
  name = "hrms/${var.environment}/app"
}

data "aws_caller_identity" "current" {}
